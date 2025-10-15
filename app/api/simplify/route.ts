import OpenAI from "openai";
import { NextResponse } from "next/server";

// Use Node runtime locally to avoid edge/env quirks while debugging
export const runtime = "nodejs";

const MAX_INPUT_CHARS = 12000;

function stripCodeFences(s: string) {
  return s.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
}
function safeJSON<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(stripCodeFences(raw)) as T;
    } catch {
      return fallback;
    }
  }
}

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || !text.trim()) {
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

    const system = `
You are a contract and policy simplifier.
Write concise, plain-English briefs for non-lawyers.
Identify: (1) parties/purpose, (2) key obligations/dates/$, (3) risk flags
(penalties, auto-renew, indemnity, termination, IP, jurisdiction), and (4) next steps.
Respond ONLY as strict JSON: {"summary":"...","confidence":0.0}
"confidence" is 0..1. Keep summary ~250 words and include a short quoted excerpt.
`.trim();

    const user = `--- CONTRACT / POLICY TEXT ---\n${input}\n--- END ---`;

    // Try mini; if your account/model access differs, switch to "gpt-4o"
    const model = "gpt-4o";

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // If this line causes "invalid_request_error", comment it out:
      // @ts-ignore
      // response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = safeJSON<{ summary?: string; confidence?: number }>(raw, {
      summary: raw || "No summary returned.",
      confidence: 0.7,
    });

    const confidencePct =
      typeof parsed.confidence === "number"
        ? Math.round(Math.min(1, Math.max(0, parsed.confidence)) * 100)
        : 70;

    return NextResponse.json(
      { summary: parsed.summary ?? "No summary returned.", confidence: confidencePct },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    // Log everything server-side, and send a readable message back to the client
    console.error("/api/simplify error:", err?.response?.data ?? err);

    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Failed to generate summary.";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}