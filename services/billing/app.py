import os, hmac, hashlib, json
from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel

RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

app = FastAPI(title="Billing Service")

@app.get("/healthz")
def healthz():
    return {"ok": True}

def verify_razorpay(signature: str, body: bytes):
    digest = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)

@app.post("/razorpay/webhook")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    body = await request.body()
    if not (RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature and verify_razorpay(x_razorpay_signature, body)):
        raise HTTPException(400, "Invalid signature")
    event = json.loads(body.decode())
    # TODO: upsert payment + mark invoice paid via API/db
    return {"ok": True, "event": event.get("event")}
