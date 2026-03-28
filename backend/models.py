# This defines every data shape in the system. Every agent reads and writes these.


from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    STALLED = "stalled"


class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Task(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    owner: str
    deadline: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    dependencies: List[int] = []
    risk_score: float = 0.0
    created_at: Optional[str] = None


class Alert(BaseModel):
    id: Optional[int] = None
    task_id: int
    task_title: str
    alert_type: str
    message: str
    severity: str
    created_at: Optional[str] = None


class AuditEntry(BaseModel):
    id: Optional[int] = None
    agent_name: str
    action: str
    input_summary: str
    output_summary: str
    status: str
    created_at: Optional[str] = None


class SentimentFlag(BaseModel):
    topic: str
    sentiment: str
    speaker: Optional[str] = None
    quote: str
    risk_level: str


class DependencyEdge(BaseModel):
    from_task_id: int
    to_task_id: int
    reason: str


class MeetingSummary(BaseModel):
    decisions_made: List[str]
    open_action_items: List[str]
    key_risks: List[str]
    next_meeting_agenda: List[str]
    sentiment_overview: str
    total_tasks: int
    high_priority_count: int


class AnalyzeRequest(BaseModel):
    transcript: str
    attendees: List[str]
    meeting_duration_mins: int = 45
    meeting_title: Optional[str] = "Team Meeting"


class AnalyzeResponse(BaseModel):
    tasks: List[Task]
    alerts: List[Alert]
    sentiment_flags: List[SentimentFlag]
    dependencies: List[DependencyEdge]
    summary: MeetingSummary
    audit_entries: List[AuditEntry]
    roi: dict


class StatusUpdateRequest(BaseModel):
    status: TaskStatus