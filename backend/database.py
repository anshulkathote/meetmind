import sqlite3
import json
import asyncio
from datetime import datetime
from .models import Task, Alert, AuditEntry

DB_PATH = "meetmind.db"


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db_sync():
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id    INTEGER,
            task_title TEXT,
            alert_type TEXT,
            message    TEXT,
            severity   TEXT,
            created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name     TEXT,
            action         TEXT,
            input_summary  TEXT,
            output_summary TEXT,
            status         TEXT,
            created_at     TEXT
        )
    """)
    conn.commit()
    conn.close()


async def init_db():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _init_db_sync)


# ---------------------------------------------------------------------------
# Task helpers
# ---------------------------------------------------------------------------

def _insert_task_sync(task: Task) -> int:
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO tasks
            (title, description, owner, deadline, priority, status, dependencies, risk_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task.title, task.description, task.owner,
        task.deadline, task.priority, task.status,
        json.dumps(task.dependencies), task.risk_score,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


async def insert_task(task: Task) -> int:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _insert_task_sync, task)


def _get_all_tasks_sync() -> list:
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_all_tasks() -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_all_tasks_sync)


def _get_task_by_id_sync(task_id: int):
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


async def get_task_by_id(task_id: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_task_by_id_sync, task_id)


def _update_task_status_sync(task_id: int, status: str):
    conn = _get_conn()
    conn.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
    conn.commit()
    conn.close()


async def update_task_status(task_id: int, status: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _update_task_status_sync, task_id, status)


def _update_task_risk_sync(task_id: int, risk_score: float):
    conn = _get_conn()
    conn.execute("UPDATE tasks SET risk_score = ? WHERE id = ?", (risk_score, task_id))
    conn.commit()
    conn.close()


async def update_task_risk(task_id: int, risk_score: float):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _update_task_risk_sync, task_id, risk_score)


# ---------------------------------------------------------------------------
# Alert helpers
# ---------------------------------------------------------------------------

def _insert_alert_sync(alert: Alert) -> int:
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO alerts (task_id, task_title, alert_type, message, severity, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        alert.task_id, alert.task_title, alert.alert_type,
        alert.message, alert.severity,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


async def insert_alert(alert: Alert) -> int:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _insert_alert_sync, alert)


def _get_all_alerts_sync() -> list:
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM alerts ORDER BY created_at DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_all_alerts() -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_all_alerts_sync)


# ---------------------------------------------------------------------------
# Audit helpers
# ---------------------------------------------------------------------------

def _insert_audit_sync(entry: AuditEntry):
    conn = _get_conn()
    conn.execute("""
        INSERT INTO audit_log
            (agent_name, action, input_summary, output_summary, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        entry.agent_name, entry.action,
        entry.input_summary, entry.output_summary,
        entry.status, datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()


async def insert_audit(entry: AuditEntry):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _insert_audit_sync, entry)


def _get_audit_log_sync() -> list:
    conn = _get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM audit_log ORDER BY created_at ASC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


async def get_audit_log() -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_audit_log_sync)