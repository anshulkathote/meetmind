import json
from openai import AsyncOpenAI
from ..config import OPENAI_API_KEY
from ..models import Task, DependencyEdge, AuditEntry
from ..database import insert_audit
import aiosqlite
from database import DB_PATH

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

DEPENDENCY_PROMPT = """
You are an expert project manager analyzing task dependencies.

Given a list of tasks, identify which tasks MUST be completed before others can start.

Rules:
- Only flag real blockers, not just "nice to have" ordering
- from_task_id must be completed BEFORE to_task_id can start
- Explain the reason clearly in one sentence
- If no dependencies exist, return empty list

Return ONLY valid JSON, no markdown.

Output format:
{
  "dependencies": [
    {
      "from_task_id": <int>,
      "to_task_id": <int>,
      "reason": "..."
    }
  ]
}
"""

async def run_dependency(tasks: list[Task]) -> tuple[list[DependencyEdge], AuditEntry]:
    audit = AuditEntry(
        agent_name="DependencyAgent",
        action="map_dependencies",
        input_summary=f"Analyzing dependencies for {len(tasks)} tasks",
        output_summary="",
        status="success"
    )

    if len(tasks) < 2:
        audit.output_summary = "Not enough tasks for dependency analysis"
        await insert_audit(audit)
        return [], audit

    try:
        tasks_json = json.dumps([
            {"id": t.id, "title": t.title, "description": t.description}
            for t in tasks
        ])

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": DEPENDENCY_PROMPT},
                {"role": "user", "content": f"TASKS:\n{tasks_json}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)

        edges = []
        task_ids = {t.id for t in tasks}

        for d in data.get("dependencies", []):
            from_id = d.get("from_task_id")
            to_id = d.get("to_task_id")

            # Validate both IDs actually exist
            if from_id not in task_ids or to_id not in task_ids:
                continue
            if from_id == to_id:
                continue

            edge = DependencyEdge(
                from_task_id=from_id,
                to_task_id=to_id,
                reason=d.get("reason", "")
            )
            edges.append(edge)

            # Also update the task's dependency list in DB
            async with aiosqlite.connect(DB_PATH) as db:
                row = await db.execute("SELECT dependencies FROM tasks WHERE id=?", (to_id,))
                result = await row.fetchone()
                if result:
                    existing = json.loads(result[0] or "[]")
                    if from_id not in existing:
                        existing.append(from_id)
                    await db.execute(
                        "UPDATE tasks SET dependencies=? WHERE id=?",
                        (json.dumps(existing), to_id)
                    )
                await db.commit()

        audit.output_summary = f"Found {len(edges)} dependencies"
        await insert_audit(audit)
        return edges, audit

    except Exception as e:
        audit.status = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit