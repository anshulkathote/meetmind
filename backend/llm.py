import asyncio
import time
import re
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY

_last_call_time = 0.0
_MIN_INTERVAL = 4.0


async def _rate_limit():
    global _last_call_time
    now = time.monotonic()
    elapsed = now - _last_call_time
    if elapsed < _MIN_INTERVAL:
        await asyncio.sleep(_MIN_INTERVAL - elapsed)
    _last_call_time = time.monotonic()


def _get_client() -> genai.Client:
    return genai.Client(api_key=GEMINI_API_KEY)


def _clean_json(text: str) -> str:
    """
    Gemini sometimes wraps JSON in markdown code fences like:
```json
    {...}
```
    This strips them so json.loads() works cleanly.
    """
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def call_llm(system_prompt: str, user_content: str) -> str:
    """JSON-mode LLM call. Returns clean JSON string."""
    await _rate_limit()
    client = _get_client()
    full_prompt = f"{system_prompt}\n\n{user_content}"
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
            ),
        )
    )
    return _clean_json(response.text)


async def call_llm_text(prompt: str) -> str:
    """Plain text LLM call. Used by escalator for human-readable messages."""
    await _rate_limit()
    client = _get_client()
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
            ),
        )
    )
    return response.text.strip()