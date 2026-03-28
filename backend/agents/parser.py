import json
from datetime import datetime
from ..models import Task, AuditEntry, TaskPriority, TaskStatus
from ..database import insert_task, insert_audit
from ..llm import call_llm

PARSER_PROMPT = """
You are an expert meeting analyst. Given a meeting transcript and a list of attendees,
extract ALL action items and tasks mentioned.

For each task return:
- title: short task name (max 8 words)
- description: what exactly needs to be done
- owner: who is responsible (must be from attendees list, or "Unassigned")
- deadline: exact deadline if mentioned (e.g. "Friday", "2024-04-01"), else null
- priority: "high", "medium", or "low" based on urgency language used

Rules:
- Only extract concrete action items, not discussion points
- If multiple people are assigned, pick the primary owner
- Detect urgency words: "ASAP", "urgent", "critical", "immediately" = high priority
- Return ONLY valid JSON, no explanation, no markdown

Output format:
{
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "owner": "...",
      "deadline": "...",
      "priority": "high|medium|low"
    }
  ]
}
"""

async def run_parser(transcript: str, attendees: list[str]) -> tuple[list[Task], AuditEntry]:
    audit = AuditEntry(
        agent_name    = "ParserAgent",
        action        = "extract_tasks",
        input_summary = f"Transcript: {len(transcript)} chars, Attendees: {', '.join(attendees)}",
        output_summary= "",
        status        = "success"
    )
    try:
        user_content = f"ATTENDEES: {', '.join(attendees)}\n\nTRANSCRIPT:\n{transcript}"
        raw  = await call_llm(PARSER_PROMPT, user_content)
        data = json.loads(raw)
        raw_tasks = data.get("tasks", [])

        tasks = []
        for t in raw_tasks:
            task = Task(
                title      = t.get("title", "Untitled Task"),
                description= t.get("description", ""),
                owner      = t.get("owner", "Unassigned"),
                deadline   = t.get("deadline"),
                priority   = TaskPriority(t.get("priority", "medium")),
                status     = TaskStatus.TODO,
                created_at = datetime.utcnow().isoformat()
            )
            task_id  = await insert_task(task)
            task.id  = task_id
            tasks.append(task)

        audit.output_summary = f"Extracted {len(tasks)} tasks"
        await insert_audit(audit)
        return tasks, audit

    except Exception as e:
        audit.status        = "error"
        audit.output_summary= f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit