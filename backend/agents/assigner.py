import json
import sqlite3
import asyncio
from datetime import date
from ..models import Task, AuditEntry, TaskPriority
from ..database import insert_audit, DB_PATH
from ..llm import call_llm

ASSIGNER_PROMPT = """
You are an expert at clarifying task ownership and deadlines.
Given a list of tasks already extracted from a meeting, refine:
1. owner — confirm or correct who should own each task
2. deadline — convert vague deadlines to ISO dates where possible.
   Today is {today}. Convert "Friday" to nearest Friday date, "next week" to Monday of next week, etc.
3. priority — re-evaluate based on deadlines and language

Return the SAME number of tasks in the same order with refined fields.
Return ONLY valid JSON, no markdown.

Output format:
{{
  "tasks": [
    {{
      "id": <original task id>,
      "owner": "...",
      "deadline": "YYYY-MM-DD or null",
      "priority": "high|medium|low"
    }}
  ]
}}
"""

def _update_assignments_sync(refined: dict, tasks: list[Task]) -> list[Task]:
    conn = sqlite3.connect(DB_PATH)
    for task in tasks:
        if task.id in refined:
            r             = refined[task.id]
            task.owner    = r.get("owner",    task.owner)
            task.deadline = r.get("deadline", task.deadline)
            task.priority = TaskPriority(r.get("priority", str(task.priority)))
            conn.execute(
                "UPDATE tasks SET owner=?, deadline=?, priority=? WHERE id=?",
                (task.owner, task.deadline, task.priority, task.id)
            )
    conn.commit()
    conn.close()
    return tasks

async def run_assigner(
    tasks: list[Task],
    attendees: list[str],
    workspace_id: int = 1
) -> tuple[list[Task], AuditEntry]:
    today = date.today().isoformat()
    audit = AuditEntry(
        agent_name    = "AssignerAgent",
        action        = "refine_assignments",
        input_summary = f"Refining {len(tasks)} tasks for: {', '.join(attendees)}",
        output_summary= "",
        status        = "success"
    )
    if not tasks:
        audit.output_summary = "No tasks to assign"
        await insert_audit(audit, workspace_id)
        return tasks, audit
    try:
        tasks_json = json.dumps([
            {"id": t.id, "title": t.title, "owner": t.owner,
             "deadline": t.deadline, "priority": t.priority}
            for t in tasks
        ])
        user_content = f"ATTENDEES: {', '.join(attendees)}\n\nTASKS:\n{tasks_json}"
        raw     = await call_llm(ASSIGNER_PROMPT.format(today=today), user_content)
        data    = json.loads(raw)
        refined = {t["id"]: t for t in data.get("tasks", [])}
        loop    = asyncio.get_event_loop()
        tasks   = await loop.run_in_executor(None, _update_assignments_sync, refined, tasks)
        audit.output_summary = f"Refined {len(refined)} task assignments"
        await insert_audit(audit, workspace_id)
        return tasks, audit
    except Exception as e:
        audit.status         = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit, workspace_id)
        return tasks, audit