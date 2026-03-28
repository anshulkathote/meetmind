from datetime import date
from ..models import AuditEntry
from ..database import get_all_tasks, update_task_risk, insert_audit


def _compute_risk(task: dict) -> float:
    """
    Risk score 0.0 → 1.0.
    Logic:
      - No deadline            → 0.1 (low background risk)
      - Deadline in future:
          > 7 days away        → 0.2
          3–7 days away        → 0.5
          1–2 days away        → 0.75
          today or tomorrow    → 0.9
      - Deadline already past  → 1.0
      - Status DONE            → 0.0 always
    """
    if task["status"] == "done":
        return 0.0
    if not task["deadline"]:
        return 0.1
    try:
        deadline = date.fromisoformat(task["deadline"])
        days_left = (deadline - date.today()).days
        if days_left < 0:
            return 1.0
        elif days_left == 0:
            return 0.95
        elif days_left <= 2:
            return 0.75
        elif days_left <= 7:
            return 0.5
        else:
            return 0.2
    except ValueError:
        return 0.1


async def run_sla_monitor() -> tuple[list[dict], AuditEntry]:
    audit = AuditEntry(
        agent_name="SLAMonitor",
        action="compute_risk_scores",
        input_summary="Computing risk scores for all open tasks",
        output_summary="",
        status="success"
    )

    try:
        tasks = await get_all_tasks()
        at_risk = []

        for task in tasks:
            score = _compute_risk(task)
            await update_task_risk(task["id"], score)
            task["risk_score"] = score
            if score >= 0.75:
                at_risk.append(task)

        high = [t for t in tasks if t["risk_score"] >= 0.75]
        med  = [t for t in tasks if 0.5 <= t["risk_score"] < 0.75]

        audit.output_summary = (
            f"Scored {len(tasks)} tasks — "
            f"{len(high)} high risk, {len(med)} medium risk"
        )
        await insert_audit(audit)
        return at_risk, audit

    except Exception as e:
        audit.status = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit