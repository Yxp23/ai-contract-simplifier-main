import { NextResponse } from "next/server";

// ✅ Polyfill for pdf-parse dependencies (required by pdf-parse-new as well)
// @ts-ignore
if (typeof global.DOMMatrix === "undefined") {
  // @ts-ignore
  global.DOMMatrix = class {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    invertSelf() { return this; }
    multiplySelf() { return this; }
    scale() { return this; }
    translate() { return this; }
  };
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 👇 Using the stable community-maintained fork: pdf-parse-new
    // @ts-ignore
    const pdfParse = require("pdf-parse-new");
    
    // Safety check
    if (typeof pdfParse !== "function") {
        console.error("New PDF parser failed to load as a function.");
        throw new Error("PDF parser failed to load. Check package installation.");
    }

    // ✅ pdfParse is now reliably callable
    const data = await pdfParse(buffer);
    const text = data.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted." },
        { status: 422 }
      );
    }

    console.log("✅ Extracted PDF length:", text.length);
    return NextResponse.json({ text: text.trim().slice(0, 12000) });

  } catch (err: any) {
    console.error("❌ PDF parse error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}