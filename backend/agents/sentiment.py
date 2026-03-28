import json
from openai import AsyncOpenAI
from ..config import OPENAI_API_KEY
from ..models import SentimentFlag, AuditEntry
from ..database import insert_audit

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

SENTIMENT_PROMPT = """
You are an expert at reading between the lines in meeting transcripts.
Detect any moments of frustration, confusion, disagreement, or concern.

These are hidden blockers that normal task extraction misses.

For each flag return:
- topic: what was being discussed
- sentiment: "frustrated", "confused", "disagreement", "concern", "overwhelmed"
- speaker: who expressed it (if identifiable), else null
- quote: the exact line or phrase from transcript (keep it short, max 20 words)
- risk_level: "low", "medium", "high"

Risk level guide:
- high: strong disagreement, someone refusing, deadline pressure causing stress
- medium: confusion about ownership, unclear requirements, mild pushback
- low: minor hesitation, a question without answer

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

async def run_sentiment(transcript: str) -> tuple[list[SentimentFlag], AuditEntry]:
    audit = AuditEntry(
        agent_name="SentimentAgent",
        action="analyse_sentiment",
        input_summary=f"Transcript length: {len(transcript)} chars",
        output_summary="",
        status="success"
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SENTIMENT_PROMPT},
                {"role": "user", "content": f"TRANSCRIPT:\n{transcript}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)
        raw_flags = data.get("flags", [])

        flags = []
        for f in raw_flags:
            flag = SentimentFlag(
                topic=f.get("topic", "Unknown"),
                sentiment=f.get("sentiment", "concern"),
                speaker=f.get("speaker"),
                quote=f.get("quote", ""),
                risk_level=f.get("risk_level", "low")
            )
            flags.append(flag)

        audit.output_summary = f"Detected {len(flags)} sentiment flags"
        await insert_audit(audit)
        return flags, audit

    except Exception as e:
        audit.status = "error"
        audit.output_summary = f"Error: {str(e)}"
        await insert_audit(audit)
        return [], audit