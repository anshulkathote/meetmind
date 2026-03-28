#This sets up SQLite and gives you clean helper functions every agent can call.

import aiosqlite
import json
from datetime import datetime
from .models import Task, Alert, AuditEntry

DB_PATH = "meetmind.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                description TEXT,
                owner       TEXT,
                deadline    TEXT,
                priority    TEXT DEFAULT 'medium',
                status      TEXT DEFAULT 'todo',
                dependencies TEXT DEFAULT '[]',
                risk_score  REAL DEFAULT 0.0,
                created_at  TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id     INTEGER,
                task_title  TEXT,
                alert_type  TEXT,
                message     TEXT,
                severity    TEXT,
                created_at  TEXT
            )
        """)
        await db.execute("""
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
        await db.commit()


# --- Task helpers ---

async def insert_task(task: Task) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO tasks (title, description, owner, deadline, priority, status, dependencies, risk_score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task.title, task.description, task.owner,
            task.deadline, task.priority, task.status,
            json.dumps(task.dependencies), task.risk_score,
            datetime.utcnow().isoformat()
        ))
        await db.commit()
        return cursor.lastrowid

async def get_all_tasks() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

async def get_task_by_id(task_id: int) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None

async def update_task_status(task_id: int, status: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE tasks SET status = ? WHERE id = ?",
            (status, task_id)
        )
        await db.commit()

async def update_task_risk(task_id: int, risk_score: float):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE tasks SET risk_score = ? WHERE id = ?",
            (risk_score, task_id)
        )
        await db.commit()


# --- Alert helpers ---

async def insert_alert(alert: Alert) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO alerts (task_id, task_title, alert_type, message, severity, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            alert.task_id, alert.task_title, alert.alert_type,
            alert.message, alert.severity,
            datetime.utcnow().isoformat()
        ))
        await db.commit()
        return cursor.lastrowid

async def get_all_alerts() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM alerts ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


# --- Audit log helpers ---

async def insert_audit(entry: AuditEntry):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO audit_log (agent_name, action, input_summary, output_summary, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            entry.agent_name, entry.action,
            entry.input_summary, entry.output_summary,
            entry.status, datetime.utcnow().isoformat()
        ))
        await db.commit()

async def get_audit_log() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM audit_log ORDER BY created_at ASC")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]



if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
    print("DB OK")