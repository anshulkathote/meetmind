# MeetMind — AI Meeting Intelligence System

> ET AI Hackathon 2026 | Problem Statement 2: Agentic AI for Autonomous Enterprise Workflows

MeetMind transforms any meeting transcript into a fully managed action system.
Paste a transcript → 8 AI agents run in sequence → tasks extracted, owners assigned,
dependencies mapped, SLA risks scored, escalations generated, and a full audit trail written.
Zero manual follow-up required.

---

## The Problem

Enterprise teams lose an estimated 15–30% of meeting value to poor follow-up.
Action items get forgotten, owners are unclear, blockers go undetected until it's too late.
The average knowledge worker spends 4.75 hours per week just tracking meeting outcomes.

## The Solution

MeetMind deploys 8 specialized AI agents that work in a coordinated pipeline:

| Agent | Role |
|---|---|
| Parser | Extracts all action items from raw transcript |
| Sentiment Analyser | Detects hidden blockers — frustration, confusion, overload |
| Task Assigner | Confirms owners, converts vague deadlines to ISO dates |
| Dependency Mapper | Identifies which tasks block other tasks |
| Progress Tracker | Monitors status, marks overdue tasks as stalled |
| SLA Monitor | Predicts breach risk 0.0–1.0 per task |
| Escalator | Generates professional escalation messages for at-risk tasks |
| Summariser | Produces decisions, risks, and next agenda |

---

## Architecture
```
Meeting Transcript
       │
       ▼
┌─────────────────────────────────┐
│         Master Orchestrator      │
│  sequences all 8 agents,        │
│  handles failures, writes audit  │
└─────────────────────────────────┘
       │
       ├── Layer 1 (parallel)
       │   ├── Parser Agent
       │   └── Sentiment Agent
       │
       ├── Layer 2 (sequential)
       │   ├── Assigner Agent
       │   └── Dependency Agent
       │
       ├── Layer 3 (parallel)
       │   ├── Tracker Agent
       │   └── SLA Monitor
       │
       └── Layer 4 (sequential)
           ├── Escalator Agent
           └── Summariser Agent
                │
                ▼
         SQLite Database
         (tasks, alerts, audit log)
                │
                ▼
         React Frontend
         (dashboard, dependency graph,
          audit trail, ROI calculator)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10, FastAPI, uvicorn |
| AI | Google Gemini 2.5 Flash |
| Database | SQLite (via Python built-in sqlite3) |
| Frontend | React 18, Vite, Tailwind CSS |
| Graphs | React Flow (dependency visualisation) |
| Charts | Recharts (ROI calculator) |

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API key (free tier) from https://aistudio.google.com/app/apikey

### Backend
```bash
git clone https://github.com/your-username/meetmind.git
cd meetmind

# Create .env file
echo GEMINI_API_KEY=your_key_here > .env

# Install dependencies
python -m pip install fastapi uvicorn[standard] google-genai python-dotenv pydantic python-multipart

# Start server
py -3.10 -m uvicorn backend.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/analyze` | Run full 8-agent pipeline on transcript |
| GET | `/tasks` | Get all tasks |
| PATCH | `/tasks/{id}/status` | Update task status |
| GET | `/alerts` | Get all escalation alerts |
| GET | `/audit` | Get full agent audit trail |
| GET | `/health` | Health check |

---

## Demo

Use this sample request body at `POST /analyze`:
```json
{
  "transcript": "...",
  "attendees": ["Alice", "Bob", "Carol", "David", "Sara"],
  "meeting_duration_mins": 52,
  "meeting_title": "Q3 Product & Engineering Sync"
}
```

Expected output:
- 9 tasks extracted with owners and ISO deadlines
- 14 sentiment flags detected
- 4 task dependencies mapped
- 1 escalation alert generated
- Full audit trail with all 8 agents showing success
- ROI: ₹3,520 saved per meeting

---

## Project Structure
```
meetmind/
├── backend/
│   ├── main.py              # FastAPI app, all routes
│   ├── orchestrator.py      # Master pipeline sequencer
│   ├── llm.py               # Gemini client wrapper
│   ├── database.py          # SQLite helpers
│   ├── models.py            # Pydantic data models
│   ├── config.py            # Environment config
│   └── agents/
│       ├── parser.py        # Agent 1: Extract tasks
│       ├── sentiment.py     # Agent 2: Detect sentiment
│       ├── assigner.py      # Agent 3: Refine assignments
│       ├── dependency.py    # Agent 4: Map dependencies
│       ├── tracker.py       # Agent 5: Monitor progress
│       ├── sla_monitor.py   # Agent 6: Predict SLA breach
│       ├── escalator.py     # Agent 7: Generate alerts
│       └── summariser.py    # Agent 8: Write summary
└── frontend/
    └── src/
        ├── pages/
        │   ├── UploadPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── DependencyPage.jsx
        │   ├── AuditPage.jsx
        │   └── SummaryPage.jsx
        └── components/
            ├── TaskBoard.jsx
            ├── DependencyGraph.jsx
            ├── AuditTable.jsx
            └── ROICalculator.jsx
```

---

## Team

Built for ET AI Hackathon 2026 — Problem Statement 2.