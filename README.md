# 🧠 MeetMind — AI Meeting Intelligence System

> ET AI Hackathon 2026 · Problem Statement 2: Agentic AI for Autonomous Enterprise Workflows

---

## What is MeetMind?

MeetMind transforms unstructured meeting transcripts into structured, actionable intelligence using a pipeline of 8 specialized AI agents. Paste a transcript → 8 agents run autonomously → get tasks, dependencies, sentiment analysis, alerts, summary, and ROI in seconds.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Python · FastAPI · SQLite · Google Gemini 1.5 Flash |
| Frontend | React 18 · Vite · Tailwind CSS · React Flow · Recharts |

---

## The 8-Agent Pipeline

| Agent | What it does |
|-------|-------------|
| ParserAgent | Extracts all tasks and action items from transcript |
| SentimentAgent | Detects frustration, confusion, blockers |
| AssignerAgent | Refines ownership and converts vague deadlines to ISO dates |
| DependencyAgent | Maps which tasks block other tasks |
| TrackerAgent | Marks overdue tasks as stalled |
| SLAMonitor | Computes risk scores (0.0–1.0) per task |
| EscalatorAgent | Generates escalation alerts for at-risk tasks |
| SummariserAgent | Writes full meeting summary + next agenda |

Layers 1 and 3 run in parallel using `asyncio.gather()`.

---

## Project Structure
```
meetmind/
├── backend/
│   ├── main.py            ← FastAPI routes
│   ├── models.py          ← Pydantic models
│   ├── database.py        ← SQLite async helpers
│   ├── orchestrator.py    ← 4-layer agent pipeline
│   ├── llm.py             ← Gemini wrapper
│   ├── config.py          ← Env vars
│   └── agents/            ← 8 agent files
├── frontend/
│   ├── src/
│   │   ├── api/client.js  ← All Axios calls
│   │   ├── context/       ← React shared state
│   │   ├── pages/         ← 5 pages
│   │   └── components/    ← UI components
│   └── .env
└── meetmind.db            ← Auto-created on first run
```

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (free at aistudio.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/meetmind.git
cd meetmind
```

### 2. Backend setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Create backend/.env
GEMINI_API_KEY=your_key_here

# Start backend (from meetmind/ root)
python -m uvicorn backend.main:app --reload
# Runs at http://localhost:8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

> ⚠️ Both servers must run simultaneously. Use two terminal windows.

---

## Running the App

Open `http://localhost:5173` in your browser.

1. Click **Load Demo** to auto-fill the sample transcript
2. Click **Analyse Meeting** — watch 8 agents run
3. Navigate to **Dashboard** — Kanban board, alerts, sentiment
4. Navigate to **Dependencies** — React Flow visual graph
5. Navigate to **Audit** — full agent pipeline log
6. Navigate to **Summary** — decisions, risks, ROI calculator

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Run full 8-agent pipeline |
| GET | `/tasks` | Get all tasks |
| PATCH | `/tasks/{id}/status` | Update task status |
| GET | `/alerts` | Get all alerts |
| GET | `/audit` | Get agent audit log |
| POST | `/workspace/create` | Create team workspace |
| POST | `/workspace/join` | Join workspace with invite code |
| GET | `/workspace/{code}/tasks/mine` | Get member's own tasks |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Upload | GPT-style transcript input with agent progress animation |
| `/dashboard` | Dashboard | Kanban board, metric cards, alerts, sentiment |
| `/dependencies` | Graph | React Flow dependency visualization |
| `/audit` | Audit | Full agent pipeline execution log |
| `/summary` | Summary | Meeting insights + live ROI calculator |

---

## Team Workspace Feature

- Admin creates a workspace → receives a 6-digit invite code
- Team members join using the code + their name
- Admin uploads transcript → all members see shared dashboard
- Each member has a personal **My Tasks** view with their own tasks
- Mark Complete button syncs with the main dashboard in real time

---

## Environment Variables

**`backend/.env`**
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**`frontend/.env`**
```
VITE_API_BASE=http://localhost:8000
```

---

## Demo Transcript

Use this for testing:
```
Meeting: Q3 Product Planning
Attendees: Alice, Bob, Carol, David

Alice: Bob, can you own the API rate limiting fix? Critical before the investor demo on the 15th.
Bob: Sure, I'll have it done by Friday.
Alice: Carol, we need onboarding flow designs by next Wednesday.
Carol: I'm confused about the scope — are we redesigning the whole flow?
Alice: Just the first three screens.
David: The rate limiting depends on my auth service refactor. Bob can't start until I'm done.
Alice: That's a risk. David, please send a written update on your timeline by tomorrow.
```

---

## Built With

- **Google Gemini 1.5 Flash** — powers all 8 agents
- **FastAPI** — async Python backend
- **React Flow** — dependency graph visualization
- **SQLite** — zero-config persistence
- **Tailwind CSS** — styling

---

*MeetMind — because every meeting deserves a second brain.*
