import json
import sqlite3
import asyncio
from ..models import Task, DependencyEdge, AuditEntry
from ..database import insert_audit, DB_PATH
from ..llm import call_llm

DEPENDENCY_PROMPT = """
You are an expert project manager analyzing task dependencies.
Given a list of tasks, identify which tasks MUST be completed before others can start.

Rules:
- Only flag real blockers, not just nice-to-have ordering
- from_task_id must be completed BEFORE to_task_id can start
- Explain the reason clearly in one sentence
- If no dependencies exist, return empty list
- Only use task IDs that exist in the list provided

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


def _save_dependencies_sync(edges: list[DependencyEdge]) -> None:
    conn = sqlite3.connect(DB_PATH)
    for edge in edges:
        row = conn.execute(
            "SELECT dependencies FROM tasks WHERE id=?",
            (edge.to_task_id,)
        ).fetchone()
        if row:
            existing = json.loads(row[0] or "[]")
            if edge.from_task_id not in existing:
                existing.append(edge.from_task_id)
            conn.execute(
                "UPDATE tasks SET dependencies=? WHERE id=?",
                (json.dumps(existing), edge.to_task_id)
            )
    conn.commit()
    conn.close()


async def run_dependency(
    tasks: list[Task]
) -> tuple[list[DependencyEdge], AuditEntry]:

    audit = AuditEntry(
        agent_name    = "DependencyAgent",
        action        = "map_dependencies",
        input_summary = f"Analyzing dependencies for {len(tasks)} tasks",
        output_summary= "",
        status        = "success"
    )

    if len(tasks) < 2:
        audit.output_summary = "Not enough tasks for dependency analysis"
        await insert_audit(audit)
        return [], audit

    try:
        tasks_json = json.dumps([
            {
                "id"         : t.id,
                "title"      : t.title,
                "description": t.description
            }
            for t in tasks
        ])

        raw  = await call_llm(DEPENDENCY_PROMPT, f"TASKS:\n{tasks_json}")
        data = json.loads(raw)

        task_ids = {t.id for t in tasks}
        edges    = []

        for d in data.get("dependencies", []):
            from_id = d.get("from_task_id")
            to_id   = d.get("to_task_id")

            # Skip invalid or self-referencing edges
            if from_id not in task_ids or to_id not in task_ids:
                continue
            if from_id == to_id:
                continue

            edges.append(DependencyEdge(
                from_task_id = from_id,
                to_task_id   = to_id,
                reason       = d.get("reason", "")
            ))

        # Save to DB in thread
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _save_dependencies_sync, edges)

        audit.output_summary = f"Found {len(edges)} dependencies"
        await insert_audit(audit)
        return edges, audit

    except Exception as e:
        audit.status         = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit