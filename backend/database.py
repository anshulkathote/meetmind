import sqlite3
import json
import asyncio
import random
import string
from datetime import datetime
from .models import Task, Alert, AuditEntry

DB_PATH = "meetmind.db"


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _init_db_sync():
    conn = _get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            code       TEXT UNIQUE NOT NULL,
            admin_name TEXT NOT NULL,
            created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER NOT NULL,
            name         TEXT NOT NULL,
            role         TEXT DEFAULT 'member',
            joined_at    TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER DEFAULT 1,
            title        TEXT NOT NULL,
            description  TEXT,
            owner        TEXT,
            deadline     TEXT,
            priority     TEXT DEFAULT 'medium',
            status       TEXT DEFAULT 'todo',
            dependencies TEXT DEFAULT '[]',
            risk_score   REAL DEFAULT 0.0,
            created_at   TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id INTEGER DEFAULT 1,
            task_id      INTEGER,
            task_title   TEXT,
            alert_type   TEXT,
            message      TEXT,
            severity     TEXT,
            created_at   TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id   INTEGER DEFAULT 1,
            agent_name     TEXT,
            action         TEXT,
            input_summary  TEXT,
            output_summary TEXT,
            status         TEXT,
            created_at     TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS summaries (
            workspace_id INTEGER PRIMARY KEY,
            data         TEXT,
            updated_at   TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workspace_dependencies (
            workspace_id INTEGER PRIMARY KEY,
            data         TEXT,
            updated_at   TEXT
        )
    """)
    conn.commit()
    conn.close()


async def init_db():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _init_db_sync)


# ---------------------------------------------------------------------------
# Workspace helpers
# ---------------------------------------------------------------------------

def _create_workspace_sync(name: str, admin_name: str) -> dict:
    conn = _get_conn()
    while True:
        code = _generate_code()
        exists = conn.execute("SELECT id FROM workspaces WHERE code=?", (code,)).fetchone()
        if not exists:
            break
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO workspaces (name, code, admin_name, created_at) VALUES (?,?,?,?)",
        (name, code, admin_name, datetime.utcnow().isoformat())
    )
    workspace_id = cur.lastrowid
    cur.execute(
        "INSERT INTO members (workspace_id, name, role, joined_at) VALUES (?,?,?,?)",
        (workspace_id, admin_name, 'admin', datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"id": workspace_id, "code": code, "name": name, "admin_name": admin_name}


async def create_workspace(name: str, admin_name: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _create_workspace_sync, name, admin_name)


def _get_workspace_sync(code: str):
    conn = _get_conn()
    row = conn.execute("SELECT * FROM workspaces WHERE code=?", (code,)).fetchone()
    conn.close()
    return dict(row) if row else None


async def get_workspace(code: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_workspace_sync, code)


def _join_workspace_sync(code: str, name: str) -> dict:
    conn = _get_conn()
    workspace = conn.execute("SELECT * FROM workspaces WHERE code=?", (code,)).fetchone()
    if not workspace:
        conn.close()
        return None
    workspace = dict(workspace)
    existing = conn.execute(
        "SELECT * FROM members WHERE workspace_id=? AND name=?",
        (workspace['id'], name)
    ).fetchone()
    if existing:
        conn.close()
        return {**workspace, "role": existing["role"], "already_member": True}
    conn.execute(
        "INSERT INTO members (workspace_id, name, role, joined_at) VALUES (?,?,?,?)",
        (workspace['id'], name, 'member', datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {**workspace, "role": "member", "already_member": False}


async def join_workspace(code: str, name: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _join_workspace_sync, code, name)


def _get_members_sync(workspace_id: int) -> list:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM members WHERE workspace_id=? ORDER BY role DESC, joined_at ASC",
        (workspace_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


async def get_members(workspace_id: int) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_members_sync, workspace_id)


# ---------------------------------------------------------------------------
# Clear workspace data between runs
# ---------------------------------------------------------------------------

def _clear_workspace_data_sync(workspace_id: int):
    conn = _get_conn()
    conn.execute("DELETE FROM tasks WHERE workspace_id=?", (workspace_id,))
    conn.execute("DELETE FROM alerts WHERE workspace_id=?", (workspace_id,))
    conn.execute("DELETE FROM audit_log WHERE workspace_id=?", (workspace_id,))
    conn.commit()
    conn.close()


async def clear_all(workspace_id: int = 1):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _clear_workspace_data_sync, workspace_id)


# ---------------------------------------------------------------------------
# Task helpers
# ---------------------------------------------------------------------------

def _insert_task_sync(task: Task, workspace_id: int = 1) -> int:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO tasks
            (workspace_id, title, description, owner, deadline, priority,
             status, dependencies, risk_score, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        workspace_id, task.title, task.description, task.owner,
        task.deadline, task.priority, task.status,
        json.dumps(task.dependencies), task.risk_score,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


async def insert_task(task: Task, workspace_id: int = 1) -> int:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _insert_task_sync, task, workspace_id)


def _get_all_tasks_sync(workspace_id: int = 1) -> list:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE workspace_id=? ORDER BY created_at DESC", (workspace_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_all_tasks(workspace_id: int = 1) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_all_tasks_sync, workspace_id)


def _get_tasks_for_member_sync(workspace_id: int, name: str) -> list:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM tasks WHERE workspace_id=? AND owner=? ORDER BY deadline ASC",
        (workspace_id, name)
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_tasks_for_member(workspace_id: int, name: str) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_tasks_for_member_sync, workspace_id, name)


def _get_task_by_id_sync(task_id: int):
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE id=?", (task_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


async def get_task_by_id(task_id: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_task_by_id_sync, task_id)


def _update_task_status_sync(task_id: int, status: str):
    conn = _get_conn()
    conn.execute("UPDATE tasks SET status=? WHERE id=?", (status, task_id))
    conn.commit()
    conn.close()


async def update_task_status(task_id: int, status: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _update_task_status_sync, task_id, status)


def _update_task_risk_sync(task_id: int, risk_score: float):
    conn = _get_conn()
    conn.execute("UPDATE tasks SET risk_score=? WHERE id=?", (risk_score, task_id))
    conn.commit()
    conn.close()


async def update_task_risk(task_id: int, risk_score: float):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _update_task_risk_sync, task_id, risk_score)


# ---------------------------------------------------------------------------
# Alert helpers
# ---------------------------------------------------------------------------

def _insert_alert_sync(alert: Alert, workspace_id: int = 1) -> int:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO alerts
            (workspace_id, task_id, task_title, alert_type, message, severity, created_at)
        VALUES (?,?,?,?,?,?,?)
    """, (
        workspace_id, alert.task_id, alert.task_title,
        alert.alert_type, alert.message, alert.severity,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


async def insert_alert(alert: Alert, workspace_id: int = 1) -> int:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _insert_alert_sync, alert, workspace_id)


def _get_all_alerts_sync(workspace_id: int = 1) -> list:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM alerts WHERE workspace_id=? ORDER BY created_at DESC", (workspace_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_all_alerts(workspace_id: int = 1) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_all_alerts_sync, workspace_id)


# ---------------------------------------------------------------------------
# Audit helpers
# ---------------------------------------------------------------------------

def _insert_audit_sync(entry: AuditEntry, workspace_id: int = 1):
    conn = _get_conn()
    conn.execute("""
        INSERT INTO audit_log
            (workspace_id, agent_name, action, input_summary, output_summary, status, created_at)
        VALUES (?,?,?,?,?,?,?)
    """, (
        workspace_id, entry.agent_name, entry.action,
        entry.input_summary, entry.output_summary,
        entry.status, datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()


async def insert_audit(entry: AuditEntry, workspace_id: int = 1):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _insert_audit_sync, entry, workspace_id)


def _get_audit_log_sync(workspace_id: int = 1) -> list:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM audit_log WHERE workspace_id=? ORDER BY created_at ASC",
        (workspace_id,)
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_audit_log(workspace_id: int = 1) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_audit_log_sync, workspace_id)

# ---------------------------------------------------------------------------
# Summary helpers (stored as JSON blob per workspace)
# ---------------------------------------------------------------------------

def _upsert_summary_sync(workspace_id: int, summary_json: str):
    conn = _get_conn()
    conn.execute("""
        INSERT INTO summaries (workspace_id, data, updated_at)
        VALUES (?,?,?)
        ON CONFLICT(workspace_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
    """, (workspace_id, summary_json, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

async def upsert_summary(workspace_id: int, summary_json: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _upsert_summary_sync, workspace_id, summary_json)

def _get_summary_sync(workspace_id: int):
    conn = _get_conn()
    try:
        row = conn.execute("SELECT data FROM summaries WHERE workspace_id=?", (workspace_id,)).fetchone()
    except Exception:
        row = None
    conn.close()
    return row["data"] if row else None

async def get_summary(workspace_id: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_summary_sync, workspace_id)


# ---------------------------------------------------------------------------
# Dependency helpers (stored as JSON blob per workspace)
# ---------------------------------------------------------------------------

def _upsert_dependencies_sync(workspace_id: int, deps_json: str):
    conn = _get_conn()
    conn.execute("""
        INSERT INTO workspace_dependencies (workspace_id, data, updated_at)
        VALUES (?,?,?)
        ON CONFLICT(workspace_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
    """, (workspace_id, deps_json, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

async def upsert_dependencies(workspace_id: int, deps_json: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _upsert_dependencies_sync, workspace_id, deps_json)

def _get_dependencies_sync(workspace_id: int):
    conn = _get_conn()
    try:
        row = conn.execute("SELECT data FROM workspace_dependencies WHERE workspace_id=?", (workspace_id,)).fetchone()
    except Exception:
        row = None
    conn.close()
    return row["data"] if row else None

async def get_dependencies(workspace_id: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_dependencies_sync, workspace_id)