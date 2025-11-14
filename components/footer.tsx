"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 py-10 bg-background/50 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row md:justify-between gap-8">

        {/* Left: Branding */}
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold">AI Contract Simplifier</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Convert complex contracts into clear, plain-English summaries with risks,
            obligations, money, dates, and next steps.
          </p>
        </div>

        {/* Middle: Quick Links */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium mb-1">Quick Links</p>
          <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="#how" className="text-muted-foreground hover:text-foreground">How It Works</Link>
          <Link href="#contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
        </div>

        {/* Right: Social */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium mb-1">Social</p>
          <Link
            href="https://github.com"
            target="_blank"
            className="text-muted-foreground hover:text-foreground"
          >
            Gmail: pyash6706@gmail.com
          </Link>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI Contract Simplifier — All rights reserved.
      </div>
    </footer>
  );
}
