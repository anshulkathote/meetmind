from ..models import Alert, AuditEntry
from ..database import get_all_tasks, insert_alert, insert_audit
from ..llm import call_llm_text

ESCALATION_PROMPT = """
You are a professional project coordinator writing escalation messages.
Write a concise, firm but respectful escalation message for a stalled or at-risk task.

The message should:
- State the task name and owner clearly
- Mention the deadline and how overdue or at-risk it is
- Ask for an immediate status update
- Be 2-3 sentences max
- Sound like it came from a real project manager, not a bot

Return ONLY the message text, no JSON, no formatting.
"""

async def _generate_message(task: dict) -> str:
    prompt = (
        f"{ESCALATION_PROMPT}\n\n"
        f"Task: '{task['title']}'\n"
        f"Owner: {task['owner']}\n"
        f"Deadline: {task.get('deadline', 'Not set')}\n"
        f"Status: {task['status']}\n"
        f"Risk score: {task.get('risk_score', 0):.2f}"
    )
    try:
        return await call_llm_text(prompt)
    except Exception:
        return (
            f"Task '{task['title']}' assigned to {task['owner']} "
            f"is overdue (deadline: {task.get('deadline', 'N/A')}). "
            "Please provide an immediate status update."
        )


def _severity(risk_score: float) -> str:
    if risk_score >= 0.9: return "high"
    if risk_score >= 0.6: return "medium"
    return "low"


async def run_escalator(stalled_tasks: list[dict]) -> tuple[list[Alert], AuditEntry]:
    audit = AuditEntry(
        agent_name    = "EscalatorAgent",
        action        = "generate_escalations",
        input_summary = f"Processing {len(stalled_tasks)} stalled tasks",
        output_summary= "",
        status        = "success"
    )
    try:
        all_tasks = await get_all_tasks()
        high_risk = [
            t for t in all_tasks
            if t.get("risk_score", 0) >= 0.75
            and t["status"] != "done"
            and t["id"] not in {s["id"] for s in stalled_tasks}
        ]
        targets = stalled_tasks + high_risk
        alerts  = []

        for task in targets:
            message  = await _generate_message(task)
            alert    = Alert(
                task_id   = task["id"],
                task_title= task["title"],
                alert_type= "stalled" if task["status"] == "stalled" else "sla_breach",
                message   = message,
                severity  = _severity(task.get("risk_score", 0.5))
            )
            alert.id = await insert_alert(alert)
            alerts.append(alert)

        audit.output_summary = f"Generated {len(alerts)} alerts"
        await insert_audit(audit)
        return alerts, audit

    except Exception as e:
        audit.status        = "error"
        audit.output_summary= f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit