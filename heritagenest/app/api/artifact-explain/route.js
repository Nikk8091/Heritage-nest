import { NextResponse } from "next/server";

const FASTAPI_CHATBOT_URL =
  process.env.FASTAPI_CHATBOT_URL || "http://127.0.0.1:8000/chat";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildArtifactContext(item) {
  const tags = Array.isArray(item?.tags) ? item.tags.join(", ") : "";
  return [
    `Title: ${item?.title || "Unknown"}`,
    `Description: ${item?.description || "Not provided"}`,
    `State: ${item?.state || "Unknown"}`,
    `District: ${item?.district || "Unknown"}`,
    `Community: ${item?.community || "Unknown"}`,
    `Category: ${item?.category || "Unknown"}`,
    `Art Form: ${item?.art_form || "Unknown"}`,
    `Tags: ${tags || "None"}`,
    `Media Type: ${item?.media_type || "Unknown"}`,
  ].join("\n");
}

function normalizeError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
  }
  return fallback;
}

function normalizeQuestionInput(question) {
  const raw = String(question || "").trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const genericPromptRegex =
    /^(explain|xplain|explain this|xplain this|explain it|xplain it|describe this|describe it|about this|what is this|tell me more|more|details?)\??$/i;

  if (!raw) return raw;
  if (genericPromptRegex.test(normalized)) {
    return "Please explain this currently opened artifact in simple learning format: short overview, historical context, cultural significance, and key visual or performance traits.";
  }

  return raw;
}

async function callFastApi({ item, question, history }) {
  const response = await fetch(FASTAPI_CHATBOT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      item,
      question,
      history: Array.isArray(history) ? history : [],
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text || "FastAPI chatbot returned invalid response." };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: normalizeError(data, "FastAPI chatbot request failed."),
    };
  }

  return { ok: true, data };
}

async function callGroqFallback({ item, question, history }) {
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!groqKey) {
    return {
      ok: false,
      status: 503,
      error:
        "Cannot reach FastAPI chatbot service and GROQ_API_KEY is missing. Start FastAPI with: C:/Python314/python.exe -m uvicorn chatbot_api:app --app-dir d:/heritagenest/heritagenest/ai_service --host 127.0.0.1 --port 8000",
    };
  }

  const systemRules =
    "You are HeriNest AI, an educational cultural heritage assistant. You can answer ONLY about the currently opened artifact context. " +
    "If the user asks about another artifact or unrelated topic, reply exactly: 'I can only explain the currently opened art card. Please open another art card to get info about another artifact.'";

  const context = `Current artifact context (use only this context for answers):\n${buildArtifactContext(item)}`;

  const messages = [
    { role: "system", content: systemRules },
    { role: "system", content: context },
    ...(Array.isArray(history)
      ? history
          .slice(-8)
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content }))
      : []),
    { role: "user", content: question },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.3,
      messages,
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: normalizeError(data, "Groq fallback request failed."),
    };
  }

  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) {
    return {
      ok: false,
      status: 502,
      error: "Groq fallback returned empty response.",
    };
  }

  return {
    ok: true,
    data: {
      answer,
      model: groqModel,
      source: "groq-fallback",
    },
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item, question, history } = body || {};

    if (!item?.title) {
      return NextResponse.json({ error: "Missing artifact data." }, { status: 400 });
    }

    if (!question || !String(question).trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const normalizedQuestion = normalizeQuestionInput(question);

    let result = null;
    try {
      result = await callFastApi({ item, question: normalizedQuestion, history });
    } catch {
      result = await callGroqFallback({ item, question: normalizedQuestion, history });
    }

    if (!result?.ok) {
      return NextResponse.json({ error: result?.error || "Chatbot request failed." }, { status: result?.status || 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    const errorMessage = error?.message || "Unknown server error.";
    const hint =
      "If using FastAPI mode, start it with: C:/Python314/python.exe -m uvicorn chatbot_api:app --app-dir d:/heritagenest/heritagenest/ai_service --host 127.0.0.1 --port 8000";

    return NextResponse.json(
      {
        error: `${errorMessage}. ${hint}`,
      },
      { status: 500 }
    );
  }
}
