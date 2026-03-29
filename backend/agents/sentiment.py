import json
from ..models import SentimentFlag, AuditEntry
from ..database import insert_audit
from ..llm import call_llm

SENTIMENT_PROMPT = """
You are an expert at reading between the lines in meeting transcripts.
Detect any moments of frustration, confusion, disagreement, or concern.

For each flag return:
- topic: what was being discussed
- sentiment: "frustrated", "confused", "disagreement", "concern", "overwhelmed"
- speaker: who expressed it (if identifiable), else null
- quote: the exact line or phrase from transcript (max 20 words)
- risk_level: "low", "medium", "high"

Return ONLY valid JSON, no markdown.

Output format:
{
  "flags": [
    {
      "topic": "...",
      "sentiment": "...",
      "speaker": "...",
      "quote": "...",
      "risk_level": "high|medium|low"
    }
  ]
}
"""

async def run_sentiment(
    transcript: str,
    workspace_id: int = 1
) -> tuple[list[SentimentFlag], AuditEntry]:
    audit = AuditEntry(
        agent_name    = "SentimentAgent",
        action        = "analyse_sentiment",
        input_summary = f"Transcript: {len(transcript)} chars",
        output_summary= "",
        status        = "success"
    )
    try:
        raw   = await call_llm(SENTIMENT_PROMPT, f"TRANSCRIPT:\n{transcript}")
        data  = json.loads(raw)
        flags = [
            SentimentFlag(
                topic     = f.get("topic", "Unknown"),
                sentiment = f.get("sentiment", "concern"),
                speaker   = f.get("speaker"),
                quote     = f.get("quote", ""),
                risk_level= f.get("risk_level", "low")
            )
            for f in data.get("flags", [])
        ]
        audit.output_summary = f"Detected {len(flags)} sentiment flags"
        await insert_audit(audit, workspace_id)
        return flags, audit
    except Exception as e:
        audit.status         = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit, workspace_id)
        return [], audit