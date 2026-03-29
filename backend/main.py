# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager
# import json

# from .database import (
#     init_db, get_all_tasks, get_all_alerts, get_audit_log,
#     update_task_status, get_task_by_id,
#     create_workspace, get_workspace, join_workspace,
#     get_members, get_tasks_for_member,
# )
# from .models import (
#     AnalyzeRequest, AnalyzeResponse, StatusUpdateRequest,
#     WorkspaceCreate, WorkspaceJoin,
# )
# from .orchestrator import Orchestrator


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     await init_db()
#     yield


# app = FastAPI(
#     title="MeetMind API",
#     description="AI Meeting Intelligence System — ET Hackathon 2026",
#     version="2.0.0",
#     lifespan=lifespan,
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins     = ["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials = True,
#     allow_methods     = ["*"],
#     allow_headers     = ["*"],
# )


# # ── Health ────────────────────────────────────────────────────────────────

# @app.get("/health")
# async def health():
#     return {"status": "ok", "service": "MeetMind API"}


# # ── Workspace ─────────────────────────────────────────────────────────────

# @app.post("/workspace/create")
# async def workspace_create(body: WorkspaceCreate):
#     if not body.name.strip():
#         raise HTTPException(400, "Workspace name is required.")
#     if not body.admin_name.strip():
#         raise HTTPException(400, "Admin name is required.")
#     return await create_workspace(body.name.strip(), body.admin_name.strip())


# @app.post("/workspace/join")
# async def workspace_join(body: WorkspaceJoin):
#     if not body.code.strip():
#         raise HTTPException(400, "Invite code is required.")
#     if not body.name.strip():
#         raise HTTPException(400, "Your name is required.")
#     result = await join_workspace(body.code.strip().upper(), body.name.strip())
#     if not result:
#         raise HTTPException(404, "Workspace not found. Check your invite code.")
#     return result


# @app.get("/workspace/{code}")
# async def workspace_get(code: str):
#     workspace = await get_workspace(code.upper())
#     if not workspace:
#         raise HTTPException(404, "Workspace not found.")
#     return workspace


# @app.get("/workspace/{code}/members")
# async def workspace_members(code: str):
#     workspace = await get_workspace(code.upper())
#     if not workspace:
#         raise HTTPException(404, "Workspace not found.")
#     return await get_members(workspace["id"])


# @app.get("/workspace/{code}/tasks/mine")
# async def my_tasks(code: str, name: str):
#     workspace = await get_workspace(code.upper())
#     if not workspace:
#         raise HTTPException(404, "Workspace not found.")
#     tasks = await get_tasks_for_member(workspace["id"], name)
#     for t in tasks:
#         t["dependencies"] = json.loads(t.get("dependencies") or "[]")
#     return tasks


# # ── Analyze ───────────────────────────────────────────────────────────────

# @app.post("/analyze", response_model=AnalyzeResponse)
# async def analyze(req: AnalyzeRequest):
#     if not req.transcript.strip():
#         raise HTTPException(400, "Transcript cannot be empty.")
#     if not req.attendees:
#         raise HTTPException(400, "At least one attendee is required.")
#     return await Orchestrator().run(req)


# # ── Tasks ─────────────────────────────────────────────────────────────────

# @app.get("/tasks")
# async def get_tasks(workspace_id: int = 1):
#     tasks = await get_all_tasks(workspace_id)
#     for t in tasks:
#         t["dependencies"] = json.loads(t.get("dependencies") or "[]")
#     return tasks


# @app.patch("/tasks/{task_id}/status")
# async def patch_task_status(task_id: int, body: StatusUpdateRequest):
#     task = await get_task_by_id(task_id)
#     if not task:
#         raise HTTPException(404, f"Task {task_id} not found.")

#     dep_ids = json.loads(task.get("dependencies") or "[]")
#     if body.status in ("in_progress", "done") and dep_ids:
#         blocking = []
#         for dep_id in dep_ids:
#             dep = await get_task_by_id(dep_id)
#             if dep and dep["status"] != "done":
#                 blocking.append(dep["title"])
#         if blocking:
#             raise HTTPException(
#                 409,
#                 f"Cannot mark as {body.status}. Complete first: {', '.join(blocking)}"
#             )

#     await update_task_status(task_id, body.status)
#     return {"message": "Status updated", "task_id": task_id, "new_status": body.status}


# # ── Alerts / Audit ────────────────────────────────────────────────────────

# @app.get("/alerts")
# async def get_alerts(workspace_id: int = 1):
#     return await get_all_alerts(workspace_id)


# @app.get("/audit")
# async def get_audit(workspace_id: int = 1):
#     return await get_audit_log(workspace_id)


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from .database import (
    init_db, get_all_tasks, get_all_alerts, get_audit_log,
    update_task_status, get_task_by_id,
    create_workspace, get_workspace, join_workspace,
    get_members, get_tasks_for_member,
    get_summary, get_dependencies,
)
from .models import (
    AnalyzeRequest, AnalyzeResponse, StatusUpdateRequest,
    WorkspaceCreate, WorkspaceJoin,
)
from .orchestrator import Orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="MeetMind API",
    description="AI Meeting Intelligence System — ET Hackathon 2026",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Health ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "MeetMind API"}


# ── Workspace ─────────────────────────────────────────────────────────────

@app.post("/workspace/create")
async def workspace_create(body: WorkspaceCreate):
    if not body.name.strip():
        raise HTTPException(400, "Workspace name is required.")
    if not body.admin_name.strip():
        raise HTTPException(400, "Admin name is required.")
    return await create_workspace(body.name.strip(), body.admin_name.strip())


@app.post("/workspace/join")
async def workspace_join(body: WorkspaceJoin):
    if not body.code.strip():
        raise HTTPException(400, "Invite code is required.")
    if not body.name.strip():
        raise HTTPException(400, "Your name is required.")
    result = await join_workspace(body.code.strip().upper(), body.name.strip())
    if not result:
        raise HTTPException(404, "Workspace not found. Check your invite code.")
    return result


@app.get("/workspace/{code}")
async def workspace_get(code: str):
    workspace = await get_workspace(code.upper())
    if not workspace:
        raise HTTPException(404, "Workspace not found.")
    return workspace


@app.get("/workspace/{code}/members")
async def workspace_members(code: str):
    workspace = await get_workspace(code.upper())
    if not workspace:
        raise HTTPException(404, "Workspace not found.")
    return await get_members(workspace["id"])


@app.get("/workspace/{code}/tasks/mine")
async def my_tasks(code: str, name: str):
    workspace = await get_workspace(code.upper())
    if not workspace:
        raise HTTPException(404, "Workspace not found.")
    tasks = await get_tasks_for_member(workspace["id"], name)
    for t in tasks:
        t["dependencies"] = json.loads(t.get("dependencies") or "[]")
    return tasks


# ── Analyze ───────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not req.transcript.strip():
        raise HTTPException(400, "Transcript cannot be empty.")
    if not req.attendees:
        raise HTTPException(400, "At least one attendee is required.")
    return await Orchestrator().run(req)


# ── Tasks ─────────────────────────────────────────────────────────────────

@app.get("/tasks")
async def get_tasks(workspace_id: int = 1):
    tasks = await get_all_tasks(workspace_id)
    for t in tasks:
        t["dependencies"] = json.loads(t.get("dependencies") or "[]")
    return tasks


@app.patch("/tasks/{task_id}/status")
async def patch_task_status(task_id: int, body: StatusUpdateRequest):
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(404, f"Task {task_id} not found.")

    dep_ids = json.loads(task.get("dependencies") or "[]")
    if body.status in ("in_progress", "done") and dep_ids:
        blocking = []
        for dep_id in dep_ids:
            dep = await get_task_by_id(dep_id)
            if dep and dep["status"] != "done":
                blocking.append(dep["title"])
        if blocking:
            raise HTTPException(
                409,
                f"Cannot mark as {body.status}. Complete first: {', '.join(blocking)}"
            )

    await update_task_status(task_id, body.status)
    return {"message": "Status updated", "task_id": task_id, "new_status": body.status}


# ── Alerts / Audit ────────────────────────────────────────────────────────

@app.get("/alerts")
async def get_alerts(workspace_id: int = 1):
    return await get_all_alerts(workspace_id)


@app.get("/audit")
async def get_audit(workspace_id: int = 1):
    return await get_audit_log(workspace_id)


# ── Summary / Dependencies ────────────────────────────────────────────────

@app.get("/summary")
async def get_summary_endpoint(workspace_id: int = 1):
    import json as _json
    data = await get_summary(workspace_id)
    if not data:
        raise HTTPException(404, "No summary found. Analyze a meeting first.")
    return _json.loads(data)


@app.get("/dependencies")
async def get_dependencies_endpoint(workspace_id: int = 1):
    import json as _json
    data = await get_dependencies(workspace_id)
    if not data:
        return []
    return _json.loads(data)