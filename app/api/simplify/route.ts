import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";
const MAX_INPUT_CHARS = 12000;

type SummaryJSON = {
  tldr: string;
  parties_purpose: string;
  obligations: { you: string[]; them: string[] };
  money_dates: { payments: string[]; dates: string[] };
  risk_flags: string[];
  actions: string[];
  unknowns: string[];
  excerpt: string;
  confidence: number;
};

// ---------- Helpers ----------
function asArray(x: unknown): string[] {
  if (Array.isArray(x)) return x.map(String).filter(Boolean);
  if (typeof x === "string" && x.trim()) return [x.trim()];
  return [];
}

function normalize(payload: any): SummaryJSON {
  return {
    tldr: String(payload?.tldr ?? ""),
    parties_purpose: String(payload?.parties_purpose ?? ""),
    obligations: {
      you: asArray(payload?.obligations?.you),
      them: asArray(payload?.obligations?.them),
    },
    money_dates: {
      payments: asArray(payload?.money_dates?.payments),
      dates: asArray(payload?.money_dates?.dates),
    },
    risk_flags: asArray(payload?.risk_flags),
    actions: asArray(payload?.actions),
    unknowns: asArray(payload?.unknowns),
    excerpt: String(payload?.excerpt ?? ""),
    confidence: Math.max(0, Math.min(100, Math.round(Number(payload?.confidence ?? 70)))),
  };
}

// Tolerant JSON extractor (handles ```json fences and stray text)
function extractJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {}
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return {};
}

// ---------- Route ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "");
    const tone = body?.tone === "brief" ? "brief" : "simple"; // Default to 'simple' for plain-language mode

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
    }

    const input = text.slice(0, MAX_INPUT_CHARS);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!openai.apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY on server" }, { status: 500 });
    }

    const MODEL = "gpt-4o";

    // ----- Tone Directives -----
    const TONE_DIRECTIVES =
      tone === "simple"
        ? `
TONE = "simple explanation"
- Write in plain English at a 7th-grade reading level.
- Use short, clear sentences and examples if helpful.
- Define legal jargon the first time it appears (e.g., "indemnity (you cover their losses)").
- Explain each clause as if you were helping a small business owner understand it.
- Describe what each clause means in real life — e.g., "If you miss a report, they can delay payment."
- Include the purpose behind the rule ("This protects the Commission from unfinished work.").
- Be thorough but readable — aim to teach, not just summarize.
`.trim()
        : `
TONE = "brief summary"
- Be compact and executive-ready (bullet fragments are fine).
- Focus only on key clauses, responsibilities, and risk points.
`.trim();

    // ----- System Prompt -----
    const system = `
You are an expert contract explainer AI.
Your job is to read legal contracts and rewrite them in *clear, everyday English* while keeping every key legal meaning.

Return STRICT JSON in this shape:
{
  "tldr": "1–2 sentence plain-language summary of the contract",
  "parties_purpose": "who is involved and why the contract exists (in full sentences)",
  "obligations": { 
    "you": ["plain-English explanations of your responsibilities"],
    "them": ["plain-English explanations of the other party's responsibilities"]
  },
  "money_dates": { 
    "payments": ["explain payment terms, limits, and timing clearly"], 
    "dates": ["explain start, end, and termination conditions clearly"]
  },
  "risk_flags": ["highlight risky or one-sided terms in plain English"],
  "actions": ["list what the reader should actually do"],
  "unknowns": ["list missing or unspecified details like amounts or dates"],
  "excerpt": "include one or two short quotes from the original text that show tone or key phrasing",
  "confidence": 0.0
}

${TONE_DIRECTIVES}

Global rules:
- Use ONLY JSON. No extra prose or markdown outside JSON.
- Write full, natural sentences instead of bullet fragments.
- Avoid legalese; prefer simple explanations.
- If information is missing, state 'not specified'.
- "confidence" should be between 0–1.
`.trim();

    const user = `CONTRACT TEXT:\n${input}\n`;

    // ---------- Attempt 1: JSON mode ----------
    let raw = "";
    let parsed: any = {};
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      });
      raw = (completion.choices[0]?.message?.content ?? "").trim();
      parsed = extractJSON(raw);
    } catch (e) {
      console.warn("JSON mode failed, retrying in text mode...", e);
    }

    // ---------- Attempt 2: Fallback (text mode) ----------
    if (!parsed || Object.keys(parsed).length === 0) {
      const retry = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `${system}\nIf JSON mode fails, output valid JSON manually between \`\`\`json fences.`,
          },
          { role: "user", content: user },
        ],
      });
      raw = (retry.choices[0]?.message?.content ?? "").trim();
      parsed = extractJSON(raw);
    }

    // ---------- Normalize ----------
    const normalized = normalize(parsed);

    if (!normalized.tldr && text.length > 30) {
      normalized.tldr = "Plain-English summary unavailable — please retry.";
    }

    if (typeof parsed?.confidence === "number" && parsed.confidence <= 1) {
      normalized.confidence = Math.round(parsed.confidence * 100);
    }

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error("/api/simplify error:", err?.response?.data || err);
    const message =
      err?.status === 429
        ? "Rate limit or quota reached. Check your OpenAI billing/limits."
        : "Failed to generate summary.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

