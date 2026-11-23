"""PII detection service backed by GLiNER.

It only finds spans of personal data; it never stores or returns anything else.
The bot does the replacing and keeps the per-chat token map.
"""

import os

from fastapi import FastAPI
from gliner import GLiNER
from pydantic import BaseModel, Field

MODEL_NAME = os.getenv("GLINER_MODEL", "urchade/gliner_multi_pii-v1")
THRESHOLD = float(os.getenv("GLINER_THRESHOLD", "0.5"))

# GLiNER label (natural language) -> tag used in placeholders.
# Organisations are deliberately not redacted: company names are context, not personal data.
LABELS = {
    "person": "PERSON",
    "address": "ADDRESS",
    "phone number": "PHONE",
    "email": "EMAIL",
    "credit card number": "CARD",
    "bank account number": "BANK_ACCOUNT",
    "passport number": "PASSPORT",
    "national id number": "NATIONAL_ID",
    "date of birth": "DOB",
}

model = GLiNER.from_pretrained(MODEL_NAME)
app = FastAPI()


class DetectRequest(BaseModel):
    texts: list[str] = Field(max_length=200)


class Entity(BaseModel):
    start: int
    end: int
    label: str
    score: float


class DetectResponse(BaseModel):
    results: list[list[Entity]]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect")
def detect(req: DetectRequest) -> DetectResponse:
    results: list[list[Entity]] = []
    for text in req.texts:
        if not text.strip():
            results.append([])
            continue
        entities = model.predict_entities(text, list(LABELS), threshold=THRESHOLD)
        results.append(
            [
                Entity(start=e["start"], end=e["end"], label=LABELS[e["label"]], score=e["score"])
                for e in entities
                if e["label"] in LABELS
            ]
        )
    return DetectResponse(results=results)
