import json
from openai import AsyncOpenAI
from ..config import OPENAI_API_KEY
from ..models import Task, AuditEntry, TaskPriority
from ..database import insert_audit, update_task_status
import aiosqlite
from database import DB_PATH

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

ASSIGNER_PROMPT = """
You are an expert at clarifying task ownership and deadlines.

Given a list of tasks (already extracted from a meeting), refine:
1. owner — confirm or correct who should own each task
2. deadline — convert vague deadlines to ISO dates where possible
   Today is {today}. Convert "Friday" → nearest Friday date, "next week" → Monday of next week, etc.
3. priority — re-evaluate based on deadlines and language

Return the SAME number of tasks in the same order, with refined fields.
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

async def run_assigner(tasks: list[Task], attendees: list[str]) -> tuple[list[Task], AuditEntry]:
    from datetime import date
    today = date.today().isoformat()

    audit = AuditEntry(
        agent_name="AssignerAgent",
        action="refine_assignments",
        input_summary=f"Refining {len(tasks)} tasks for attendees: {', '.join(attendees)}",
        output_summary="",
        status="success"
    )

    if not tasks:
        audit.output_summary = "No tasks to assign"
        await insert_audit(audit)
        return tasks, audit

    try:
        tasks_json = json.dumps([
            {"id": t.id, "title": t.title, "owner": t.owner,
             "deadline": t.deadline, "priority": t.priority}
            for t in tasks
        ])

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ASSIGNER_PROMPT.format(today=today)},
                {"role": "user", "content": f"ATTENDEES: {', '.join(attendees)}\n\nTASKS:\n{tasks_json}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)
        refined = {t["id"]: t for t in data.get("tasks", [])}

        # Update tasks in place + in DB
        async with aiosqlite.connect(DB_PATH) as db:
            for task in tasks:
                if task.id in refined:
                    r = refined[task.id]
                    task.owner = r.get("owner", task.owner)
                    task.deadline = r.get("deadline", task.deadline)
                    task.priority = TaskPriority(r.get("priority", task.priority))
                    await db.execute(
                        "UPDATE tasks SET owner=?, deadline=?, priority=? WHERE id=?",
                        (task.owner, task.deadline, task.priority, task.id)
                    )
            await db.commit()

        audit.output_summary = f"Refined {len(refined)} task assignments"
        await insert_audit(audit)
        return tasks, audit

    except Exception as e:
        audit.status = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return tasks, audit