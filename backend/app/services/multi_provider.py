"""
multi_provider.py
─────────────────
Universal AI provider with automatic fallback.

Fallback order (first valid key wins, rate-limited providers are skipped):
  1. Google Gemini  (gemini-1.5-flash)
  2. Groq           (llama-3.3-70b-versatile)
  3. OpenRouter     (meta-llama/llama-3.3-70b-instruct:free)
  4. OpenAI         (gpt-4o-mini)

If every provider fails → falls back to a deterministic rule-based response
so the user never sees a raw 500 error.
"""

import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

# ── key sanitizer ─────────────────────────────────────────────────────────────

_MOCK_KEYS = {"mock", "your-gemini-api-key-here", "your-groq-api-key-here",
              "your-openrouter-api-key-here", "your-openai-api-key-here",
              "sk-your-openai-key-here", "sk-proj-your"}


def _clean(raw: str) -> Optional[str]:
    """Strip whitespace/quotes and return None for placeholder keys."""
    key = (raw or "").strip().strip("'").strip('"')
    if not key:
        return None
    for mock in _MOCK_KEYS:
        if key == mock or key.startswith(mock):
            return None
    return key


# ── rate-limit / quota error detection ───────────────────────────────────────

def _is_quota_error(exc: Exception) -> bool:
    """Return True for rate-limit / quota-exceeded errors from any provider."""
    msg = str(exc).lower()
    quota_signals = [
        "rate limit", "ratelimit", "quota", "429",
        "resource_exhausted", "too many requests",
        "insufficient_quota", "exceeded"
    ]
    return any(s in msg for s in quota_signals)


# ── provider implementations ─────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    key = _clean(settings.GEMINI_API_KEY)
    if not key:
        raise ValueError("Gemini key not configured")
    import google.generativeai as genai
    genai.configure(api_key=key)
    # Try gemini-2.0-flash first, fall back to gemini-1.5-flash-latest
    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"]:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            logger.info(f"[MultiProvider] Gemini using model: {model_name}")
            return response.text
        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                logger.warning(f"[MultiProvider] Gemini model {model_name} not available, trying next")
                continue
            raise
    raise ValueError("No available Gemini model found")


def _call_groq(prompt: str) -> str:
    key = _clean(settings.GROQ_API_KEY)
    if not key:
        raise ValueError("Groq key not configured")
    if key.startswith("xai-"):
        logger.info("[MultiProvider] Groq key starts with 'xai-' -> redirecting to xAI (Grok)")
        return _call_xai(prompt)
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1024,
    )
    return resp.choices[0].message.content.strip()


def _call_xai(prompt: str) -> str:
    key = _clean(settings.XAI_API_KEY) or _clean(settings.GROQ_API_KEY)
    if not key:
        raise ValueError("xAI key not configured")
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url="https://api.x.ai/v1")
    # Try models in order — grok-beta is deprecated
    for model_name in ["grok-3-mini", "grok-3", "grok-2-1212", "grok-2"]:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1024,
            )
            logger.info(f"[MultiProvider] xAI using model: {model_name}")
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if "not found" in str(e).lower() or "404" in str(e) or "invalid-argument" in str(e):
                logger.warning(f"[MultiProvider] xAI model {model_name} not found, trying next")
                continue
            raise
    raise ValueError("No available xAI model found")


# Free models on OpenRouter to try in order (fallback on rate-limit)
_OPENROUTER_FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen3-8b:free",
    "deepseek/deepseek-r1-0528:free",
]

def _call_openrouter(prompt: str) -> str:
    key = _clean(settings.OPENROUTER_API_KEY)
    if not key:
        raise ValueError("OpenRouter key not configured")
    from openai import OpenAI
    client = OpenAI(
        api_key=key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://ai-sdr.app",
            "X-Title": "AI SDR Platform",
        }
    )
    last_err = None
    for model_name in _OPENROUTER_FREE_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1024,
            )
            logger.info(f"[MultiProvider] OpenRouter using model: {model_name}")
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower() or "rate-limited" in str(e).lower():
                logger.warning(f"[MultiProvider] OpenRouter {model_name} rate-limited, trying next")
                last_err = e
                continue
            raise
    raise last_err or RuntimeError("All OpenRouter free models rate-limited")


def _call_openai(prompt: str) -> str:
    key = _clean(settings.OPENAI_API_KEY)
    if not key:
        raise ValueError("OpenAI key not configured")
    from openai import OpenAI
    client = OpenAI(api_key=key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1024,
    )
    return resp.choices[0].message.content.strip()


# ── OpenAI-style JSON endpoint (for qualify – needs structured JSON back) ─────

def _call_openai_json(system: str, user: str) -> str:
    """OpenAI with json_object response_format for structured qualification."""
    key = _clean(settings.OPENAI_API_KEY)
    if not key:
        raise ValueError("OpenAI key not configured")
    from openai import OpenAI
    client = OpenAI(api_key=key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        max_tokens=500,
    )
    return resp.choices[0].message.content.strip()


def _call_groq_json(system: str, user: str) -> str:
    key = _clean(settings.GROQ_API_KEY)
    if not key:
        raise ValueError("Groq key not configured")
    if key.startswith("xai-"):
        logger.info("[MultiProvider] Groq key starts with 'xai-' -> redirecting to xAI (Grok)")
        return _call_xai_json(system, user)
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        max_tokens=500,
    )
    return resp.choices[0].message.content.strip()


def _call_xai_json(system: str, user: str) -> str:
    key = _clean(settings.XAI_API_KEY) or _clean(settings.GROQ_API_KEY)
    if not key:
        raise ValueError("xAI key not configured")
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url="https://api.x.ai/v1")
    for model_name in ["grok-3-mini", "grok-3", "grok-2-1212", "grok-2"]:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            logger.info(f"[MultiProvider] xAI JSON using model: {model_name}")
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if "not found" in str(e).lower() or "404" in str(e) or "invalid-argument" in str(e):
                logger.warning(f"[MultiProvider] xAI JSON model {model_name} not found, trying next")
                continue
            raise
    raise ValueError("No available xAI model found")


def _call_openrouter_json(system: str, user: str) -> str:
    key = _clean(settings.OPENROUTER_API_KEY)
    if not key:
        raise ValueError("OpenRouter key not configured")
    from openai import OpenAI
    client = OpenAI(
        api_key=key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={"HTTP-Referer": "https://ai-sdr.app", "X-Title": "AI SDR Platform"},
    )
    last_err = None
    for model_name in _OPENROUTER_FREE_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            logger.info(f"[MultiProvider] OpenRouter JSON using model: {model_name}")
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower() or "rate-limited" in str(e).lower():
                logger.warning(f"[MultiProvider] OpenRouter JSON {model_name} rate-limited, trying next")
                last_err = e
                continue
            raise
    raise last_err or RuntimeError("All OpenRouter free models rate-limited")


# ── PUBLIC API ────────────────────────────────────────────────────────────────

PROVIDERS = [
    ("Gemini",      _call_gemini),
    ("Groq",        _call_groq),
    ("XAI",         _call_xai),
    ("OpenRouter",  _call_openrouter),
    ("OpenAI",      _call_openai),
]

JSON_PROVIDERS = [
    ("Gemini",      None),          # Gemini handled separately (uses generate_content)
    ("Groq",        _call_groq_json),
    ("XAI",         _call_xai_json),
    ("OpenRouter",  _call_openrouter_json),
    ("OpenAI",      _call_openai_json),
]


def generate_text(prompt: str) -> str:
    """
    Try each provider in PROVIDERS order.
    Skip unconfigured keys.
    On rate-limit/quota → silently try next.
    On other errors → log and try next.
    Raises RuntimeError if no keys configured or all configured providers fail.
    """
    last_error = None
    configured_any = False
    for name, fn in PROVIDERS:
        key_name = f"{name.upper()}_API_KEY"
        raw_key = getattr(settings, key_name, None)
        if not _clean(raw_key):
            continue
        configured_any = True
        try:
            result = fn(prompt)
            if result:
                logger.info(f"[MultiProvider] ✓ {name}")
                return result
        except ValueError:
            continue
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning(f"[MultiProvider] {name} quota/rate-limit hit → trying next provider")
            else:
                logger.warning(f"[MultiProvider] {name} error: {exc} → trying next provider")
            last_error = exc
            continue

    if not configured_any:
        debug_info = {}
        for provider_name, _ in PROVIDERS:
            k_name = f"{provider_name.upper()}_API_KEY"
            raw_v = getattr(settings, k_name, None) or ""
            debug_info[k_name] = f"len={len(raw_v)}, preview={raw_v[:5]}..." if raw_v else "empty"
        raise RuntimeError(f"No AI API keys are configured. Active env values seen by backend: {debug_info}. Path: {getattr(settings.Config, 'env_file', '.env')}")
    raise RuntimeError(f"All configured AI providers failed. Last error: {last_error}")


def generate_json(system_prompt: str, user_prompt: str) -> str:
    """
    Like generate_text but for structured JSON responses.
    Gemini is tried first via its native API (prompted to return JSON),
    then falls through to OpenAI-compatible JSON-mode providers.
    """
    configured_any = False
    
    # Try Gemini first
    gemini_key = _clean(settings.GEMINI_API_KEY)
    if gemini_key:
        configured_any = True
        try:
            combined = f"{system_prompt}\n\nRespond ONLY with valid JSON.\n\n{user_prompt}"
            result = _call_gemini(combined)
            if result:
                logger.info("[MultiProvider] ✓ Gemini (JSON)")
                return result
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning("[MultiProvider] Gemini quota hit → trying next for JSON")
            else:
                logger.warning(f"[MultiProvider] Gemini JSON error: {exc}")

    # Try remaining JSON-mode providers
    last_error = None
    for name, fn in JSON_PROVIDERS[1:]:   # skip Gemini (index 0)
        key_name = f"{name.upper()}_API_KEY"
        raw_key = getattr(settings, key_name, None)
        if not _clean(raw_key):
            continue
        configured_any = True
        try:
            result = fn(system_prompt, user_prompt)
            if result:
                logger.info(f"[MultiProvider] ✓ {name} (JSON)")
                return result
        except ValueError:
            continue
        except Exception as exc:
            if _is_quota_error(exc):
                logger.warning(f"[MultiProvider] {name} quota hit → trying next for JSON")
            else:
                logger.warning(f"[MultiProvider] {name} JSON error: {exc}")
            last_error = exc
            continue

    if not configured_any:
        debug_info = {}
        for provider_name in ["GEMINI", "GROQ", "XAI", "OPENROUTER", "OPENAI"]:
            k_name = f"{provider_name}_API_KEY"
            raw_v = getattr(settings, k_name, None) or ""
            debug_info[k_name] = f"len={len(raw_v)}, preview={raw_v[:5]}..." if raw_v else "empty"
        raise RuntimeError(f"No AI API keys are configured for JSON. Active env values seen by backend: {debug_info}. Path: {getattr(settings.Config, 'env_file', '.env')}")
    raise RuntimeError(f"All configured AI providers failed for JSON. Last error: {last_error}")



