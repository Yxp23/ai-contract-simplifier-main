"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Wallet, Calendar, Quote, Users } from "lucide-react";

export type SummaryJSON = {
  tldr: string;
  partiesPurpose: string;
  youMust: string[];
  theyMust: string[];
  moneyTerms: string | null;
  datesAndDeadlines: string | null;
  riskFlags: string[];           // high-signal issues
  excerpt: string | null;
};

export function SummaryView({ data }: { data: SummaryJSON }) {
  return (
    <div className="space-y-5">
      {/* TL;DR */}
      <section>
        <p className="text-sm font-semibold mb-1">TL;DR</p>
        <p className="leading-relaxed text-sm">{data.tldr}</p>
      </section>

      <Separator />

      {/* Parties & Purpose */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-semibold">Parties & Purpose</p>
        </div>
        <p className="text-sm leading-relaxed">{data.partiesPurpose}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* You Must */}
        <section className="space-y-2">
          <p className="text-sm font-semibold">You Must</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {data.youMust.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </section>

        {/* They Must */}
        <section className="space-y-2">
          <p className="text-sm font-semibold">They Must</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {data.theyMust.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Money */}
        {data.moneyTerms && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-semibold">Money</p>
            </div>
            <p className="text-sm leading-relaxed">{data.moneyTerms}</p>
          </section>
        )}

        {/* Dates */}
        {data.datesAndDeadlines && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold">Dates</p>
            </div>
            <p className="text-sm leading-relaxed">{data.datesAndDeadlines}</p>
          </section>
        )}
      </div>

      {/* Risks */}
      {data.riskFlags.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-red-500">Risk Flags</p>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {data.riskFlags.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </section>
      )}

      {/* Excerpt */}
      {data.excerpt && (
        <>
          <Separator />
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Excerpt</p>
            </div>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {data.excerpt}
                </p>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}