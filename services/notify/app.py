import os
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

GUPSHUP_API_KEY = os.getenv("GUPSHUP_API_KEY", "")
GUPSHUP_SOURCE = os.getenv("GUPSHUP_SOURCE", "")
GUPSHUP_APP = os.getenv("GUPSHUP_APP", "")

app = FastAPI(title="Notify Service (Gupshup)")

@app.get("/healthz")
def healthz():
    return {"ok": True}

class WhatsAppMsg(BaseModel):
    to: str           # E.164 number
    template_id: str  # pre-approved template on Gupshup
    params: dict = {} # template variables

@app.post("/whatsapp/send")
async def whatsapp_send(body: WhatsAppMsg):
    # Note: Gupshup has multiple endpoints. This is a placeholder structure.
    # Implement per your Gupshup account type (template/interactive).
    payload = {
        "channel": "whatsapp",
        "source": GUPSHUP_SOURCE,
        "destination": body.to,
        "src.name": GUPSHUP_APP,
        "template": body.template_id,
        "disablePreview": "true",
        "apikey": GUPSHUP_API_KEY,
        "templateParams": list(body.params.values()) if body.params else []
    }
    async with httpx.AsyncClient(timeout=20) as client:
        # Replace with your actual Gupshup endpoint
        resp = await client.post("https://api.gupshup.io/wa/api/v1/template/msg", data=payload)
    return {"status": resp.status_code, "text": resp.text}
