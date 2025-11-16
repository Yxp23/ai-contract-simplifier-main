import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";
const MAX_INPUT_CHARS = 350000;

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

// Extract JSON from messy LLM outputs
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
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return {};
}

// ---------- API Route ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "");
    const tone = body?.tone === "brief" ? "brief" : "simple";

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
    }

    const input = text.slice(0, MAX_INPUT_CHARS);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    const MODEL = "gpt-4o";

    // ---------- Tone rules ----------
    const TONE_DIRECTIVES =
      tone === "simple"
        ? `
Write in plain English for a 7th-grade reading level.
Use short sentences. Define legal jargon the first time it appears.
Highlight what each clause means in real life.
`
        : `
Be concise, executive-ready, and sharply focused on key terms.
`;

    // ---------- Dual-Pass Extraction System Prompt ----------
    const system = `
You are a legal contract analysis AI.

Your job is to perform a TWO-STEP reasoning pipeline:

========================================================
STEP 1 — EXTRACTION (Not shown to user)
Extract EVERY important clause from the contract including:
- Parties & roles
- Purpose of agreement
- All obligations of the subcontractor (every duty, process, reporting requirement)
- All obligations of the contractor
- Payment terms, timing, invoices, deductions, penalties
- Dates, deadlines, termination rules, notices
- Liability, indemnity, responsibility, damage clauses
- Insurance requirements and minimum coverage amounts
- Safety/SHE responsibilities + penalties
- Confidentiality
- Intellectual property
- Force majeure
- Security requirements
- Assignment, subcontracting
- Risk flags, one-sided clauses, concerning obligations
- Anything missing or unclear

This extraction should be *exhaustive*, even if the contract is long.
You MUST use this extraction to produce an accurate summary.

========================================================
STEP 2 — SUMMARY (This is what you output)
Using the extraction above, write STRICT JSON:

{
  "tldr": "",
  "parties_purpose": "",
  "obligations": { "you": [], "them": [] },
  "money_dates": { "payments": [], "dates": [] },
  "risk_flags": [],
  "actions": [],
  "unknowns": [],
  "excerpt": "",
  "confidence": 0
}

========================================================
RULES:
- Output ONLY JSON.
- Summaries MUST be complete — no skipped clauses.
- Avoid legal jargon unless defined in simple language.
- Include 1–2 real quotes from the contract in "excerpt".
- confidence = number between 0–1
- If any information is missing in the contract, list it under "unknowns".
- Base your summary ONLY on the provided text (no hallucination).
${TONE_DIRECTIVES}
========================================================
`;

    const user = `CONTRACT TEXT:\n${input}`;

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
      console.warn("JSON mode failed:", e);
    }

    // ---------- Attempt 2: Text mode fallback ----------
    if (!parsed || Object.keys(parsed).length === 0) {
      const retry = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `${system}\nIf JSON mode fails, output valid JSON inside \`\`\`json fences.`,
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
      normalized.tldr = "Summary unavailable — please retry.";
    }

    if (typeof parsed?.confidence === "number" && parsed.confidence <= 1) {
      normalized.confidence = Math.round(parsed.confidence * 100);
    }

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error("/api/simplify error:", err?.response?.data || err);
    const message =
      err?.status === 429
        ? "Rate limit or quota reached."
        : "Failed to generate summary.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
