import os
import sys
from openai import OpenAI

key = os.environ.get("FEATHERLESS_API_KEY", "")
if not key:
    sys.exit("FEATHERLESS_API_KEY no está definida.")

client = OpenAI(
    api_key=key,
    base_url=os.environ.get("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1"),
)
resp = client.chat.completions.create(
    model="moonshotai/Kimi-K3",
    messages=[{"role": "user", "content": "Responde únicamente: OK"}],
    max_tokens=10,
)
print(resp.choices[0].message.content)

