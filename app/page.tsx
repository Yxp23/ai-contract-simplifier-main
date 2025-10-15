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

export default function Page() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    if (file.type.startsWith("text/")) {
      const t = await file.text();
      setText(t);
    } else if (file.type === "application/pdf") {
      toast.info(
        "PDF support will be added in a later step. Try a .txt file or paste text today."
      );
    } else {
      toast.error("Unsupported file type. Please use .txt or paste text.");
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
  setConfidence(null);

  try {
    const res = await fetch("/api/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data: { summary: string; confidence?: number } = await res.json();
    setResult(data.summary || "");
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
    setConfidence(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Hero with FadeIn + ambient glow */}
      <FadeIn>
        <section className="card-ambient relative rounded-2xl border bg-card/60 backdrop-blur p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {/* optional label */}
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Contract & Document Simplifier
              </h1>
              <p className="text-muted-foreground">
                Paste a contract or upload a file. Get a clean, plain-English
                brief with risks and next steps.
              </p>
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
                        .txt today · PDF coming Day 7
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
                ) : result ? (
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
                      if (!result) return;
                      navigator.clipboard.writeText(result);
                      toast.success("Summary copied to clipboard");
                    }}
                    disabled={!result}
                  >
                    Copy
                  </Button>
                </MotionButton>
                <MotionButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!result) return;
                      const blob = new Blob([result], { type: "text/plain" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = "contract-summary.txt";
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    disabled={!result}
                  >
                    Download
                  </Button>
                </MotionButton>
              </CardFooter>
            </Card>
          </FadeIn>
        </div>
      </Stagger>
    </div>
  );
}