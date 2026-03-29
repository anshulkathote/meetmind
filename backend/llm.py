import asyncio
import time
import re
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY

_last_call_time = 0.0
_MIN_INTERVAL = 6.0


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
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def _call_with_retry(fn, retries=3):
    """
    Retries an LLM call up to 3 times if rate limited.
    Waits 60 seconds on a 429 before retrying.
    """
    for attempt in range(retries):
        try:
            return await fn()
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                wait = 60
                print(f"Rate limited. Waiting {wait}s before retry {attempt + 1}/{retries}...")
                await asyncio.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded — Gemini rate limit")


async def call_llm(system_prompt: str, user_content: str) -> str:
    await _rate_limit()
    client = _get_client()
    full_prompt = f"{system_prompt}\n\n{user_content}"
    loop = asyncio.get_event_loop()

    async def fn():
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

    return await _call_with_retry(fn)


async def call_llm_text(prompt: str) -> str:
    await _rate_limit()
    client = _get_client()
    loop = asyncio.get_event_loop()

    async def fn():
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

    return await _call_with_retry(fn)