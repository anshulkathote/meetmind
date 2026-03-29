import asyncio
import json
from datetime import datetime

from .models import (
    AnalyzeRequest, AnalyzeResponse, Task, Alert,
    AuditEntry, SentimentFlag, DependencyEdge, MeetingSummary,
)
from .database import init_db, get_all_tasks, clear_all, upsert_summary, upsert_dependencies
from .agents.parser      import run_parser
from .agents.sentiment   import run_sentiment
from .agents.assigner    import run_assigner
from .agents.dependency  import run_dependency
from .agents.tracker     import run_tracker
from .agents.sla_monitor import run_sla_monitor
from .agents.escalator   import run_escalator
from .agents.summariser  import run_summariser


def _compute_roi(attendees, duration_mins, tasks, alerts):
    hourly_rate_inr    = 800
    person_hours       = round((len(attendees) * duration_mins) / 60, 2)
    manual_followup_hr = round((len(attendees) * 15) / 60, 2)
    saved_hr           = round(manual_followup_hr * 0.70, 2)
    value_inr          = round(saved_hr * hourly_rate_inr * len(attendees), 2)
    return {
        "person_hours"        : person_hours,
        "manual_followup_hrs" : manual_followup_hr,
        "followup_saved_hrs"  : saved_hr,
        "value_inr"           : value_inr,
        "assumptions": {
            "hourly_rate_inr"        : hourly_rate_inr,
            "followup_reduction_pct" : 70,
            "avg_followup_mins"      : 15,
        }
    }


async def _safe_run(coro, fallback):
    try:
        return await coro
    except Exception as e:
        fallback_audit = AuditEntry(
            agent_name="Orchestrator", action="agent_failure",
            input_summary="N/A", output_summary=f"Error: {str(e)}",
            status="error", created_at=datetime.utcnow().isoformat()
        )
        from .database import insert_audit
        await insert_audit(fallback_audit)
        return fallback


class Orchestrator:
    async def run(self, req: AnalyzeRequest) -> AnalyzeResponse:
        await init_db()
        wid = req.workspace_id or 1
        await clear_all(wid)

        all_audit = []

        # Layer 1
        (tasks, parse_audit), (sentiment_flags, sent_audit) = await asyncio.gather(
            _safe_run(
                run_parser(req.transcript, req.attendees, wid),
                ([], AuditEntry(agent_name="ParserAgent", action="extract_tasks",
                                input_summary="", output_summary="Skipped", status="error"))
            ),
            _safe_run(
                run_sentiment(req.transcript, wid),
                ([], AuditEntry(agent_name="SentimentAgent", action="analyse_sentiment",
                                input_summary="", output_summary="Skipped", status="error"))
            ),
        )
        all_audit.extend([parse_audit, sent_audit])

        # Layer 2
        tasks, assign_audit = await _safe_run(
            run_assigner(tasks, req.attendees, wid),
            (tasks, AuditEntry(agent_name="AssignerAgent", action="refine_assignments",
                               input_summary="", output_summary="Skipped", status="error"))
        )
        all_audit.append(assign_audit)

        dependencies, dep_audit = await _safe_run(
            run_dependency(tasks, wid),
            ([], AuditEntry(agent_name="DependencyAgent", action="map_dependencies",
                            input_summary="", output_summary="Skipped", status="error"))
        )
        all_audit.append(dep_audit)

        # Layer 3
        (stalled_tasks, track_audit), (at_risk_tasks, sla_audit) = await asyncio.gather(
            _safe_run(
                run_tracker(wid),
                ([], AuditEntry(agent_name="TrackerAgent", action="check_stalled_tasks",
                                input_summary="", output_summary="Skipped", status="error"))
            ),
            _safe_run(
                run_sla_monitor(wid),
                ([], AuditEntry(agent_name="SLAMonitor", action="compute_risk_scores",
                                input_summary="", output_summary="Skipped", status="error"))
            ),
        )
        all_audit.extend([track_audit, sla_audit])

        # Layer 4
        alerts, esc_audit = await _safe_run(
            run_escalator(stalled_tasks, wid),
            ([], AuditEntry(agent_name="EscalatorAgent", action="generate_escalations",
                            input_summary="", output_summary="Skipped", status="error"))
        )
        all_audit.append(esc_audit)

        summary, sum_audit = await _safe_run(
            run_summariser(req.transcript, tasks, sentiment_flags, wid),
            (
                MeetingSummary(
                    decisions_made=[], open_action_items=[t.title for t in tasks],
                    key_risks=[], next_meeting_agenda=[],
                    sentiment_overview="Summary unavailable.",
                    total_tasks=len(tasks), high_priority_count=0,
                ),
                AuditEntry(agent_name="SummariserAgent", action="generate_summary",
                           input_summary="", output_summary="Skipped", status="error")
            )
        )
        all_audit.append(sum_audit)

        final_tasks_raw = await get_all_tasks(wid)
        final_tasks = [
            Task(
                id=t["id"], workspace_id=t["workspace_id"],
                title=t["title"], description=t["description"],
                owner=t["owner"], deadline=t["deadline"],
                priority=t["priority"], status=t["status"],
                dependencies=json.loads(t["dependencies"] or "[]"),
                risk_score=t["risk_score"], created_at=t["created_at"],
            )
            for t in final_tasks_raw
        ]

        roi = _compute_roi(req.attendees, req.meeting_duration_mins, final_tasks, alerts)

        # Persist summary and dependencies so members can fetch them via API
        await upsert_summary(wid, summary.model_dump_json())
        await upsert_dependencies(wid, json.dumps([d.model_dump() for d in dependencies]))

        return AnalyzeResponse(
            tasks=final_tasks, alerts=alerts,
            sentiment_flags=sentiment_flags, dependencies=dependencies,
            summary=summary, audit_entries=all_audit, roi=roi,
        )