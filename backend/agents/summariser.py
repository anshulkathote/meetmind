import json
from ..models import MeetingSummary, AuditEntry, Task, SentimentFlag
from ..database import insert_audit
from ..llm import call_llm

SUMMARY_PROMPT = """
You are an expert meeting facilitator writing a post-meeting summary.
Given the transcript, extracted tasks, and sentiment flags, produce a structured summary.

Return ONLY valid JSON, no markdown.

Output format:
{
  "decisions_made":       ["...", "..."],
  "open_action_items":    ["...", "..."],
  "key_risks":            ["...", "..."],
  "next_meeting_agenda":  ["...", "..."],
  "sentiment_overview":   "One sentence describing the overall meeting tone"
}
"""

async def run_summariser(
    transcript: str,
    tasks: list[Task],
    sentiment_flags: list[SentimentFlag],
    workspace_id: int = 1
) -> tuple[MeetingSummary, AuditEntry]:
    audit = AuditEntry(
        agent_name="SummariserAgent", action="generate_summary",
        input_summary=f"{len(tasks)} tasks, {len(sentiment_flags)} sentiment flags",
        output_summary="", status="success"
    )
    try:
        tasks_text = "\n".join(
            f"- [{t.priority}] {t.title} → {t.owner} (due: {t.deadline or 'TBD'})"
            for t in tasks
        )
        sent_text = "\n".join(
            f"- [{f.risk_level}] {f.sentiment} on '{f.topic}': \"{f.quote}\""
            for f in sentiment_flags
        ) or "None detected"
        user_content = (
            f"TRANSCRIPT:\n{transcript}\n\n"
            f"TASKS:\n{tasks_text}\n\n"
            f"SENTIMENT FLAGS:\n{sent_text}"
        )
        raw  = await call_llm(SUMMARY_PROMPT, user_content)
        data = json.loads(raw)
        summary = MeetingSummary(
            decisions_made      = data.get("decisions_made", []),
            open_action_items   = data.get("open_action_items", []),
            key_risks           = data.get("key_risks", []),
            next_meeting_agenda = data.get("next_meeting_agenda", []),
            sentiment_overview  = data.get("sentiment_overview", ""),
            total_tasks         = len(tasks),
            high_priority_count = sum(1 for t in tasks if t.priority == "high")
        )
        audit.output_summary = f"{len(summary.decisions_made)} decisions, {len(summary.key_risks)} risks"
        await insert_audit(audit, workspace_id)
        return summary, audit
    except Exception as e:
        audit.status         = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit, workspace_id)
        return MeetingSummary(
            decisions_made=[], open_action_items=[t.title for t in tasks],
            key_risks=[], next_meeting_agenda=[],
            sentiment_overview="Summary unavailable.",
            total_tasks=len(tasks), high_priority_count=0
        ), audit