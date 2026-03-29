from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from .database import (
    init_db, get_all_tasks, get_all_alerts,
    get_audit_log, update_task_status, get_task_by_id
)
from .models import AnalyzeRequest, AnalyzeResponse, StatusUpdateRequest
from .orchestrator import Orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title       = "MeetMind API",
    description = "AI Meeting Intelligence System — ET Hackathon 2026",
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ---------------------------------------------------------------------------
# Dependency guard
# ---------------------------------------------------------------------------

async def _check_dependencies_complete(task: dict) -> tuple[bool, list[str]]:
    """
    Returns (ok, blocking_titles).
    ok = True means all dependencies are done — safe to proceed.
    blocking_titles = list of task titles still blocking this task.
    """
    dep_ids = json.loads(task.get("dependencies") or "[]")
    if not dep_ids:
        return True, []

    blocking = []
    for dep_id in dep_ids:
        dep_task = await get_task_by_id(dep_id)
        if dep_task and dep_task["status"] != "done":
            blocking.append(dep_task["title"])

    return len(blocking) == 0, blocking


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "MeetMind API"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    if not req.attendees:
        raise HTTPException(status_code=400, detail="At least one attendee is required.")
    orchestrator = Orchestrator()
    return await orchestrator.run(req)


@app.get("/tasks")
async def get_tasks():
    tasks = await get_all_tasks()
    for t in tasks:
        t["dependencies"] = json.loads(t.get("dependencies") or "[]")
    return tasks


@app.patch("/tasks/{task_id}/status")
async def patch_task_status(task_id: int, body: StatusUpdateRequest):
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found."
        )

    # ── Dependency guard ───────────────────────────────────────────────────
    # Only block moving TO in_progress or done
    # Allow moving back to todo or marking as stalled freely
    if body.status in ("in_progress", "done"):
        ok, blocking = await _check_dependencies_complete(task)
        if not ok:
            blocking_str = ", ".join(f'"{t}"' for t in blocking)
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Cannot mark '{task['title']}' as {body.status}. "
                    f"The following tasks must be completed first: {blocking_str}"
                )
            )
    # ──────────────────────────────────────────────────────────────────────

    await update_task_status(task_id, body.status)
    return {
        "message"   : "Status updated",
        "task_id"   : task_id,
        "new_status": body.status
    }


@app.get("/alerts")
async def get_alerts():
    return await get_all_alerts()


@app.get("/audit")
async def get_audit():
    return await get_audit_log()