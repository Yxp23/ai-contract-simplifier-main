"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "How It Works", href: "#how" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
      <nav className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80 transition"
        >
          📄 AI Contract Simplifier
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              {link.name}
            </Link>
          ))}
          
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded hover:bg-muted transition"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col gap-2 mt-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm py-2 px-2 rounded hover:bg-muted"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="https://github.com"
              target="_blank"
              onClick={() => setOpen(false)}
              className="text-sm py-2 px-2 rounded hover:bg-muted"
            >
              GitHub
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
