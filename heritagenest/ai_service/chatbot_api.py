from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="HeriNest AI Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ItemContext(BaseModel):
    title: str
    description: Optional[str] = ""
    state: Optional[str] = ""
    district: Optional[str] = ""
    community: Optional[str] = ""
    category: Optional[str] = ""
    art_form: Optional[str] = ""
    tags: List[str] = []
    media_type: Optional[str] = ""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    item: ItemContext
    question: str = Field(min_length=1, max_length=1500)
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    model: str


@lru_cache(maxsize=1)
def read_env_local() -> dict:
    env_path = Path(__file__).resolve().parents[1] / ".env.local"
    values = {}
    if not env_path.exists():
        return values

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def get_setting(name: str, default: str = "") -> str:
    value = os.getenv(name)
    if value and value.strip():
        return value.strip()
    env_values = read_env_local()
    return env_values.get(name, default)


def build_context_text(item: ItemContext) -> str:
    tags = ", ".join(item.tags) if item.tags else "None"
    return "\n".join(
        [
            f"Title: {item.title}",
            f"Description: {item.description or 'Not provided'}",
            f"State: {item.state or 'Unknown'}",
            f"District: {item.district or 'Unknown'}",
            f"Community: {item.community or 'Unknown'}",
            f"Category: {item.category or 'Unknown'}",
            f"Art Form: {item.art_form or 'Unknown'}",
            f"Tags: {tags}",
            f"Media Type: {item.media_type or 'Unknown'}",
        ]
    )


def build_messages(payload: ChatRequest) -> list[dict]:
    system_rules = (
        "You are HeriNest AI, an educational cultural heritage assistant. "
        "You can answer ONLY about the currently opened artifact context. "
        "If the user asks vague prompts like 'explain this' or 'tell me more', interpret it as a request to explain the current artifact in a helpful learning format. "
        "If the user asks about any other artifact, region, or unrelated topic, reply exactly: "
        "'I can only explain the currently opened art card. Please open another art card to get info about another artifact.' "
        "Keep responses concise, factual, and easy to understand."
    )

    context_message = (
        "Current artifact context (use only this context for answers):\n"
        + build_context_text(payload.item)
    )

    messages: list[dict] = [
        {"role": "system", "content": system_rules},
        {"role": "system", "content": context_message},
    ]

    for msg in payload.history[-8:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": payload.question})
    return messages


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    groq_key = get_setting("GROQ_API_KEY", "")
    groq_model = get_setting("GROQ_MODEL", "llama-3.1-8b-instant")

    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is missing for FastAPI chatbot.")

    body = {
        "model": groq_model,
        "temperature": 0.3,
        "messages": build_messages(payload),
    }

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {groq_key}",
                },
                json=body,
            )

        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"groq: {response.text}")

        data = response.json()
        answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not answer:
            raise HTTPException(status_code=502, detail="groq: empty response")

        return ChatResponse(answer=answer, model=groq_model)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
