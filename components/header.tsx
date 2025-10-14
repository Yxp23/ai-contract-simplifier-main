import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <span className="font-semibold">AI Contract Simplifier</span>
        </Link>

        <nav className="text-sm text-muted-foreground">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}