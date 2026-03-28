# MeetMind — Architecture Document

## Agent Roles & Communication

### Overview

MeetMind uses a layered multi-agent architecture where each agent has a
single responsibility. The Master Orchestrator sequences them, passes
outputs as inputs to the next layer, and handles failures gracefully
so one agent error never crashes the pipeline.

---

## Agent Details

### Agent 1 — Parser
- Input: Raw transcript text, list of attendees
- Process: LLM prompt with structured JSON output enforced
- Output: List of Task objects (title, description, owner, deadline, priority)
- Writes to: `tasks` table in SQLite
- Audit action: `extract_tasks`

### Agent 2 — Sentiment Analyser
- Input: Raw transcript text
- Process: LLM detects emotional signals — frustration, confusion, disagreement
- Output: List of SentimentFlag objects with speaker, quote, risk level
- Writes to: returned in API response only (not persisted)
- Audit action: `analyse_sentiment`
- Why it matters: Detects hidden blockers that task extraction misses

### Agent 3 — Task Assigner
- Input: Task list from Agent 1, attendee list
- Process: LLM refines ownership and converts vague deadlines to ISO dates
- Output: Updated Task list
- Writes to: Updates `tasks` table (owner, deadline, priority columns)
- Audit action: `refine_assignments`

### Agent 4 — Dependency Mapper
- Input: Refined task list from Agent 3
- Process: LLM identifies which tasks block other tasks
- Output: List of DependencyEdge objects (from_task_id, to_task_id, reason)
- Writes to: Updates `dependencies` column in `tasks` table
- Audit action: `map_dependencies`

### Agent 5 — Progress Tracker
- Input: All tasks from database
- Process: Pure logic — compares deadline to today, marks overdue as stalled
- Output: List of stalled task dicts
- Writes to: Updates `status` column in `tasks` table
- Audit action: `check_stalled_tasks`
- No LLM call — fast, deterministic

### Agent 6 — SLA Monitor
- Input: All tasks from database
- Process: Pure logic — computes risk score 0.0–1.0 based on deadline proximity
- Output: List of at-risk task dicts
- Writes to: Updates `risk_score` column in `tasks` table
- Audit action: `compute_risk_scores`
- Risk formula:
  - Done → 0.0
  - No deadline → 0.1
  - 7+ days → 0.2
  - 3–7 days → 0.5
  - 1–2 days → 0.75
  - Today → 0.95
  - Overdue → 1.0

### Agent 7 — Escalator
- Input: Stalled tasks from Agent 5 + high-risk tasks from Agent 6
- Process: LLM generates professional escalation message per task
- Output: List of Alert objects
- Writes to: `alerts` table in SQLite
- Audit action: `generate_escalations`

### Agent 8 — Summariser
- Input: Full transcript, task list, sentiment flags
- Process: LLM generates structured meeting summary
- Output: MeetingSummary object
- Writes to: returned in API response only
- Audit action: `generate_summary`

---

## Orchestration Flow
```
Request arrives at POST /analyze
         │
         ▼
Orchestrator.run()
         │
         ├─► [PARALLEL] Agent 1 (Parser) + Agent 2 (Sentiment)
         │         │
         │         ▼
         ├─► [SEQUENTIAL] Agent 3 (Assigner) — needs Agent 1 output
         │         │
         │         ▼
         ├─► [SEQUENTIAL] Agent 4 (Dependency) — needs Agent 3 output
         │         │
         │         ▼
         ├─► [PARALLEL] Agent 5 (Tracker) + Agent 6 (SLA Monitor)
         │         │
         │         ▼
         ├─► [SEQUENTIAL] Agent 7 (Escalator) — needs Agent 5 output
         │         │
         │         ▼
         └─► [SEQUENTIAL] Agent 8 (Summariser) — needs all outputs
                   │
                   ▼
         Fetch final state from DB
                   │
                   ▼
         Compute ROI
                   │
                   ▼
         Return AnalyzeResponse
```

---

## Error Handling

Every agent is wrapped in `_safe_run()` in the orchestrator:
```python
async def _safe_run(coro, fallback):
    try:
        return await coro
    except Exception as e:
        # Logs failure to audit trail
        # Returns fallback value
        # Pipeline continues
```

This means:
- One agent failure never crashes the whole pipeline
- Every failure is logged to the audit trail with agent name and error
- Frontend always receives a complete response shape

---

## Audit Trail

Every agent writes an AuditEntry to the `audit_log` table containing:
- `agent_name` — which agent ran
- `action` — what it did
- `input_summary` — what it received
- `output_summary` — what it produced
- `status` — success or error
- `created_at` — timestamp

This gives judges and users a full traceable record of every
decision made by every agent in chronological order.

---

## Database Schema
```sql
CREATE TABLE tasks (
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
);

CREATE TABLE alerts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    INTEGER,
    task_title TEXT,
    alert_type TEXT,
    message    TEXT,
    severity   TEXT,
    created_at TEXT
);

CREATE TABLE audit_log (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name     TEXT,
    action         TEXT,
    input_summary  TEXT,
    output_summary TEXT,
    status         TEXT,
    created_at     TEXT
);
```

---

## Tool Integrations

| Tool | Purpose |
|---|---|
| Google Gemini 2.5 Flash | LLM for all 6 AI agents |
| SQLite | Persistent task, alert, audit storage |
| FastAPI | REST API with automatic OpenAPI docs |
| React Flow | Dependency graph visualisation |
| Recharts | ROI calculator chart |