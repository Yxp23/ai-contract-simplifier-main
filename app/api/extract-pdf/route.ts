import { NextResponse } from "next/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const pdf = await getDocument({ data: bytes }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      fullText += "\n\n" + text;
    }

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: fullText.trim() });

  } catch (err: any) {
    console.error("❌ PDF parse error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
