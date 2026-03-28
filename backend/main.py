from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db, get_all_tasks, get_all_alerts, get_audit_log, update_task_status
from .models import AnalyzeRequest, AnalyzeResponse, StatusUpdateRequest
from .orchestrator import Orchestrator


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()          # creates tables if they don't exist
    yield                    # app runs here
    # (nothing to clean up)


app = FastAPI(
    title       = "MeetMind API",
    description = "AI Meeting Intelligence System — ET Hackathon 2026",
    version     = "1.0.0",
    lifespan    = lifespan,
)


# ---------------------------------------------------------------------------
# CORS — allows React dev server on port 5173
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "MeetMind API"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """
    Master endpoint. Accepts a transcript + attendees,
    runs all 8 agents, returns the full analysis.
    """
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    if not req.attendees:
        raise HTTPException(status_code=400, detail="At least one attendee is required.")

    orchestrator = Orchestrator()
    result = await orchestrator.run(req)
    return result


@app.get("/tasks")
async def get_tasks():
    """Returns all tasks from DB — useful for refreshing after status updates."""
    import json
    tasks = await get_all_tasks()
    # Parse dependencies JSON string back to list
    for t in tasks:
        t["dependencies"] = json.loads(t.get("dependencies") or "[]")
    return tasks


@app.patch("/tasks/{task_id}/status")
async def patch_task_status(task_id: int, body: StatusUpdateRequest):
    """Updates the status of a single task."""
    task = await get_task_by_id_safe(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
    await update_task_status(task_id, body.status)
    return {"message": "Status updated", "task_id": task_id, "new_status": body.status}


@app.get("/alerts")
async def get_alerts():
    return await get_all_alerts()


@app.get("/audit")
async def get_audit():
    return await get_audit_log()


# ---------------------------------------------------------------------------
# Internal helper (not a route)
# ---------------------------------------------------------------------------

async def get_task_by_id_safe(task_id: int):
    """Returns task dict or None — avoids 500 if task missing."""
    from .database import get_task_by_id
    try:
        return await get_task_by_id(task_id)
    except Exception:
        return None