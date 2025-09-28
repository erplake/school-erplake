import os, hashlib
from fastapi import FastAPI
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader, select_autoescape

LOCALE = os.getenv("SCHOOL_LOCALE", "en-IN")
env = Environment(loader=FileSystemLoader("templates"), autoescape=select_autoescape())

app = FastAPI(title="School ERPLake AI Service")

@app.get("/healthz")
def healthz():
    return {"ok": True}

class NarrativeIn(BaseModel):
    student_name: str
    grade: str
    term: str
    subjects: list[dict]  # [{name, score, max, remark?}]
    attendance_pct: float
    strengths: list[str] = []
    improvements: list[str] = []
    language: str | None = None

class NarrativeOut(BaseModel):
    text: str
    tone: str = "supportive"

@app.post("/report-card/narrative", response_model=NarrativeOut)
def narrative(body: NarrativeIn):
    lang = body.language or ("hi-IN" if LOCALE.startswith("hi") else "en-IN")
    template_name = "report_card_hi.j2" if lang.startswith("hi") else "report_card_en.j2"
    tmpl = env.get_template(template_name)
    text = tmpl.render(**body.model_dump())
    # NOTE: replace with real LLM call; this template produces a safe draft
    return NarrativeOut(text=text[:1200])
