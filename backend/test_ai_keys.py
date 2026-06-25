import os
import sys
from dotenv import load_dotenv

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.services.multi_provider import _clean

def test_gemini():
    key = _clean(settings.GEMINI_API_KEY)
    if not key:
        print("Gemini: SKIP (No key configured)")
        return
    print(f"Gemini: Testing key (length={len(key)}, preview={key[:6]}...)")
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        # Try models in order of preference
        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"]
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Say hello in 3 words.")
                print(f"Gemini: SUCCESS with model '{model_name}' -> '{response.text.strip()}'")
                return
            except Exception as e:
                if "404" in str(e) or "not found" in str(e).lower():
                    print(f"Gemini: Model '{model_name}' not available, trying next...")
                    continue
                raise
        print("Gemini: FAILED -> No available model found")
    except Exception as e:
        print(f"Gemini: FAILED -> {e}")


def test_groq():
    key = _clean(settings.GROQ_API_KEY)
    if not key:
        print("Groq: SKIP (No key configured)")
        return
    print(f"Groq: Testing key (length={len(key)}, preview={key[:6]}...)")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say hello in 3 words."}],
            max_tokens=20
        )
        print(f"Groq: SUCCESS -> '{resp.choices[0].message.content.strip()}'")
    except Exception as e:
        print(f"Groq: FAILED -> {e}")

def test_openai():
    key = _clean(settings.OPENAI_API_KEY)
    if not key:
        print("OpenAI: SKIP (No key configured)")
        return
    print(f"OpenAI: Testing key (length={len(key)}, preview={key[:6]}...)")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say hello in 3 words."}],
            max_tokens=20
        )
        print(f"OpenAI: SUCCESS -> '{resp.choices[0].message.content.strip()}'")
    except Exception as e:
        print(f"OpenAI: FAILED -> {e}")

def test_openrouter():
    key = _clean(settings.OPENROUTER_API_KEY)
    if not key:
        print("OpenRouter: SKIP (No key configured)")
        return
    print(f"OpenRouter: Testing key (length={len(key)}, preview={key[:6]}...)")
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://ai-sdr.app",
                "X-Title": "AI SDR Platform",
            }
        )
        resp = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[{"role": "user", "content": "Say hello in 3 words."}],
            max_tokens=20
        )
        print(f"OpenRouter: SUCCESS -> '{resp.choices[0].message.content.strip()}'")
    except Exception as e:
        print(f"OpenRouter: FAILED -> {e}")
def test_xai():
    key = _clean(settings.XAI_API_KEY)
    if not key:
        groq_key = _clean(settings.GROQ_API_KEY)
        if groq_key and groq_key.startswith("xai-"):
            key = groq_key
    if not key:
        print("xAI: SKIP (No key configured)")
        return
    print(f"xAI: Testing key (length={len(key)}, preview={key[:6]}...)")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key, base_url="https://api.x.ai/v1")
        for model_name in ["grok-3-mini", "grok-3", "grok-2-1212", "grok-2"]:
            try:
                resp = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": "Say hello in 3 words."}],
                    max_tokens=20
                )
                print(f"xAI: SUCCESS with model '{model_name}' -> '{resp.choices[0].message.content.strip()}'")
                return
            except Exception as e:
                if "not found" in str(e).lower() or "404" in str(e) or "invalid-argument" in str(e):
                    print(f"xAI: Model '{model_name}' not found, trying next...")
                    continue
                raise
        print("xAI: FAILED -> No available model found")
    except Exception as e:
        print(f"xAI: FAILED -> {e}")

if __name__ == "__main__":
    load_dotenv()
    print("=== AI API Connection Diagnostics ===")
    test_gemini()
    print("-" * 40)
    test_groq()
    print("-" * 40)
    test_xai()
    print("-" * 40)
    test_openai()
    print("-" * 40)
    test_openrouter()
    print("=" * 37)
