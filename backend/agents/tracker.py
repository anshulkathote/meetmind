from datetime import datetime, date
from ..models import AuditEntry, TaskStatus
from ..database import get_all_tasks, update_task_status, insert_audit


def _is_stalled(task: dict) -> bool:
    if task["status"] in (TaskStatus.DONE, TaskStatus.STALLED):
        return False
    if not task["deadline"]:
        return False
    try:
        deadline = date.fromisoformat(task["deadline"])
        return date.today() > deadline
    except ValueError:
        return False


async def run_tracker() -> tuple[list[dict], AuditEntry]:
    audit = AuditEntry(
        agent_name="TrackerAgent",
        action="check_stalled_tasks",
        input_summary="Scanning all tasks for stalls",
        output_summary="",
        status="success"
    )

    try:
        tasks = await get_all_tasks()
        stalled = []

        for task in tasks:
            if _is_stalled(task):
                await update_task_status(task["id"], TaskStatus.STALLED)
                task["status"] = TaskStatus.STALLED
                stalled.append(task)

        audit.output_summary = (
            f"Scanned {len(tasks)} tasks, marked {len(stalled)} as stalled"
        )
        await insert_audit(audit)
        return stalled, audit

    except Exception as e:
        audit.status = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit