"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FadeIn, Stagger, MotionButton } from "@/components/anim";

/** Render long text as pleasant paragraphs */
function Paragraphs({ text }: { text: string }) {
  const blocks =
    text.includes("\n\n")
      ? text.split(/\n{2,}/g)
      : text.split(/(?<=[.?!])\s+(?=[A-Z(])/g);

  return (
    <div className="space-y-2 leading-relaxed text-muted-foreground">
      {blocks
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b, i) => (
          <p key={i}>{b}</p>
        ))}
    </div>
  );
}

/* ---- Structured summary type returned by /api/simplify ---- */
type SummaryJSON = {
  tldr: string;
  parties_purpose: string;
  obligations: { you: string[]; them: string[] };
  money_dates: { payments: string[]; dates: string[] };
  risk_flags: string[];
  actions: string[];
  unknowns: string[];
  excerpt: string;
  confidence: number; // 0–100 (we normalize server-side)
};

export default function Page() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [tone, setTone] = useState<"brief" | "simple">("brief"); // ✅ tone
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep the old free-form result around just in case, but we’ll prefer `structured`
  const [result, setResult] = useState<string | null>(null);
  const [structured, setStructured] = useState<SummaryJSON | null>(null);

  const [confidence, setConfidence] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
  setFileName(file.name);

  if (file.type === "application/pdf") {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.text) {
        setText(data.text);
        toast.success("✅ PDF text extracted successfully!");
      } else {
        toast.error("No text found in PDF.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to extract PDF. Check server logs.");
    }
  } else if (file.type.startsWith("text/")) {
    const t = await file.text();
    setText(t);
  } else {
    toast.error("Unsupported file type. Please upload .pdf or .txt files.");
  }
};

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await handleFile(f);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await handleFile(f);
  };

  const onSimplify = async () => {
    if (!text.trim()) {
      toast.error("Please paste some contract text or upload a file.");
      return;
    }
    setLoading(true);
    setResult(null);
    setStructured(null);
    setConfidence(null);

    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ send the selected tone to the API
        body: JSON.stringify({ text, tone }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Expect the structured JSON from the API
      const data: SummaryJSON = await res.json();
      setStructured(data);
      setResult(null);
      setConfidence(
        typeof data.confidence === "number" ? data.confidence : 70
      );
      toast.success("Summary generated.");
    } catch (e: any) {
      console.error(e);
      toast.error("Could not generate summary. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setText("");
    setFileName("");
    setResult(null);
    setStructured(null);
    setConfidence(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Hero with FadeIn + ambient glow */}
      <FadeIn>
        <section className="card-ambient relative rounded-2xl border bg-card/60 backdrop-blur p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {/* optional label */}
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Contract &amp; Document Simplifier
              </h1>
              <p className="text-muted-foreground">
                Paste a contract or upload a file. Get a clean, plain-English
                brief with risks and next steps.
              </p>
            </div>

            {/* ✅ Tone toggle + actions */}
            <div className="flex items-center gap-3">
              {/* Segmented tone toggle (no extra deps) */}
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/50 p-1">
                <Button
                  size="sm"
                  variant={tone === "brief" ? "default" : "ghost"}
                  onClick={() => setTone("brief")}
                >
                  Brief
                </Button>
                <Button
                  size="sm"
                  variant={tone === "simple" ? "default" : "ghost"}
                  onClick={() => setTone("simple")}
                >
                  Simple
                </Button>
              </div>

              <div className="flex gap-2">
                <MotionButton>
                  <Button variant="outline" onClick={resetAll}>
                    Reset
                  </Button>
                </MotionButton>
                <MotionButton>
                  <Button onClick={onSimplify} disabled={loading || !text.trim()}>
                    {loading ? "Simplifying…" : "Simplify"}
                  </Button>
                </MotionButton>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Stagger grid; fade each column in; add ambient glow to cards */}
      <Stagger>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Input */}
          <FadeIn>
            <Card className="card-ambient shadow-sm border-border/60 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle>Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="space-y-3 pt-4">
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your contract or policy text here…"
                      className="min-h-[260px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Remove personal identifiers before sharing drafts.
                    </p>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4 pt-4">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDrop}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center hover:bg-muted/50"
                      onClick={() => fileRef.current?.click()}
                      role="button"
                    >
                      <p className="font-medium">Drag & drop your file here</p>
                      <p className="text-xs text-muted-foreground">
                        
                      </p>
                      <Input
                        ref={fileRef}
                        type="file"
                        accept=".txt,application/pdf"
                        className="hidden"
                        onChange={onFileChange}
                      />
                    </div>
                    {fileName && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Selected:</span>{" "}
                        <span className="font-medium">{fileName}</span>
                      </div>
                    )}
                    <Separator />
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="File text will appear here (or paste manually)…"
                      className="min-h-[160px]"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex items-center gap-3">
                <MotionButton>
                  <Button variant="secondary" onClick={resetAll}>
                    Clear
                  </Button>
                </MotionButton>
                <MotionButton>
                  <Button
                    onClick={onSimplify}
                    disabled={loading || !text.trim()}
                  >
                    {loading ? "Simplifying…" : "Run Simplifier"}
                  </Button>
                </MotionButton>
              </CardFooter>
            </Card>
          </FadeIn>

          {/* Right: Result */}
          <FadeIn delay={0.06}>
            <Card className="card-ambient shadow-sm border-border/60 bg-card/60 backdrop-blur">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Summary</CardTitle>
                {confidence !== null && (
                  <Badge variant="outline">Confidence: {confidence}%</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Progress value={65} />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="h-4 w-3/6" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </>
                ) : structured ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-5 text-sm"
                  >
                    <div className="space-y-1.5">
                      <p className="font-medium">TL;DR</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {structured.tldr}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="font-medium">Parties & Purpose</p>
                      <Paragraphs text={structured.parties_purpose} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="font-medium">You Must</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {structured.obligations.you.map((x, i) => (
                            <li key={`you-${i}`}>{x}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">They Must</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {structured.obligations.them.map((x, i) => (
                            <li key={`them-${i}`}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="font-medium">Money</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {structured.money_dates.payments.map((x, i) => (
                            <li key={`pay-${i}`}>{x}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Dates</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {structured.money_dates.dates.map((x, i) => (
                            <li key={`date-${i}`}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">Risk Flags</p>
                      <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {structured.risk_flags.map((x, i) => (
                          <li key={`risk-${i}`}>{x}</li>
                        ))}
                      </ul>
                      {/* Helper hint for Simple tone */}
                      {tone === "simple" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (Definitions shown in parentheses, e.g., “indemnity (you cover their losses)”.)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">Action Checklist</p>
                      <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {structured.actions.map((x, i) => (
                          <li key={`act-${i}`}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    {structured.unknowns.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium">Unknowns / Missing Info</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {structured.unknowns.map((x, i) => (
                            <li key={`unk-${i}`}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {structured.excerpt && (
                      <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                        <p className="font-medium mb-1">Excerpt</p>
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {structured.excerpt}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ) : result ? (
                  // Fallback: if server returns plain text for some reason
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {result}
                    </pre>
                  </motion.div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your plain-English brief will appear here after you click{" "}
                    <strong>Simplify</strong>.
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <MotionButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (structured) {
                        const textOut = [
                          `TL;DR: ${structured.tldr}`,
                          `Parties & Purpose: ${structured.parties_purpose}`,
                          `You Must: ${structured.obligations.you.join("; ")}`,
                          `They Must: ${structured.obligations.them.join("; ")}`,
                          `Money: ${structured.money_dates.payments.join("; ")}`,
                          `Dates: ${structured.money_dates.dates.join("; ")}`,
                          `Risks: ${structured.risk_flags.join("; ")}`,
                          `Actions: ${structured.actions.join("; ")}`,
                          structured.unknowns.length
                            ? `Unknowns: ${structured.unknowns.join("; ")}`
                            : "",
                          structured.excerpt ? `Excerpt: ${structured.excerpt}` : "",
                          `Confidence: ${structured.confidence}%`,
                        ]
                          .filter(Boolean)
                          .join("\n");
                        navigator.clipboard.writeText(textOut);
                        toast.success("Summary copied to clipboard");
                        return;
                      }
                      if (result) {
                        navigator.clipboard.writeText(result);
                        toast.success("Summary copied to clipboard");
                      }
                    }}
                    disabled={!structured && !result}
                  >
                    Copy
                  </Button>
                </MotionButton>
                <MotionButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      let textOut: string | null = null;
                      if (structured) {
                        textOut = [
                          `TL;DR: ${structured.tldr}`,
                          `Parties & Purpose: ${structured.parties_purpose}`,
                          `You Must: ${structured.obligations.you.join("; ")}`,
                          `They Must: ${structured.obligations.them.join("; ")}`,
                          `Money: ${structured.money_dates.payments.join("; ")}`,
                          `Dates: ${structured.money_dates.dates.join("; ")}`,
                          `Risks: ${structured.risk_flags.join("; ")}`,
                          `Actions: ${structured.actions.join("; ")}`,
                          structured.unknowns.length
                            ? `Unknowns: ${structured.unknowns.join("; ")}`
                            : "",
                          structured.excerpt ? `Excerpt: ${structured.excerpt}` : "",
                          `Confidence: ${structured.confidence}%`,
                        ]
                          .filter(Boolean)
                          .join("\n");
                      } else if (result) {
                        textOut = result;
                      }
                      if (!textOut) return;

                      const blob = new Blob([textOut], { type: "text/plain" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = "contract-summary.txt";
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    disabled={!structured && !result}
                  >
                    Download
                  </Button>
                </MotionButton>
              </CardFooter>
            </Card>
          </FadeIn>
        </div>
      </Stagger>

      {/* ======= FEATURES SECTION ======= */}
<section id="features" className="pt-16 border-t border-border/60">
  <FadeIn>
    <h2 className="text-xl font-semibold tracking-tight mb-2">Features</h2>
    <p className="text-sm text-muted-foreground mb-6">
      Why people use this contract simplifier.
    </p>

    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Risk Detection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Highlights clauses that may expose you to financial or legal risk.
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Plain-English Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          TL;DR, obligations, money, deadlines, risks — all simplified.
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">PDF + Text Support</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Paste text or upload a PDF — the extractor handles the rest.
        </CardContent>
      </Card>
    </div>
  </FadeIn>
</section>

{/* ======= PRICING SECTION ======= */}
<section id="pricing" className="pt-16 border-t border-border/60">
  <FadeIn>
    <h2 className="text-xl font-semibold tracking-tight mb-2">Pricing</h2>
    <p className="text-sm text-muted-foreground mb-6">
      Simple, transparent, and free while in beta.
    </p>

    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle>Free Tier</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Unlimited text pastes</li>
            <li>PDF extraction</li>
            <li>Brief + Simple modes</li>
            <li>Copy/export output</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-card/60">
        <CardHeader>
          <CardTitle>Pro Tier (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Team workspace, saved history, fast processing, and more.
        </CardContent>
      </Card>
    </div>
  </FadeIn>
</section>

{/* ======= HOW IT WORKS SECTION ======= */}
<section id="how" className="pt-16 border-t border-border/60">
  <FadeIn>
    <h2 className="text-xl font-semibold tracking-tight mb-2">How It Works</h2>
    <p className="text-sm text-muted-foreground mb-6">
      Three quick steps from contract → clarity.
    </p>

    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">1. Upload or Paste</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add your contract text or PDF.
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">2. Choose Tone</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select Brief (executive) or Simple (plain English).
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">3. Review Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You get obligations, money, risks, and next steps.
        </CardContent>
      </Card>
    </div>
  </FadeIn>
</section>

{/* ======= CONTACT SECTION ======= */}
<section id="contact" className="pt-16 border-t border-border/60 pb-20">
  <FadeIn>
    <h2 className="text-xl font-semibold tracking-tight mb-2">Contact</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Got feedback or feature requests?
    </p>

    <Card className="bg-card/70">
      <CardContent className="py-4 text-sm text-muted-foreground">
        Email: <span className="font-medium">pyash6706@gmail.com</span>
        <br />
        
      </CardContent>
    </Card>
  </FadeIn>
</section>

    </div>
  );
}
