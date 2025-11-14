import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ThemeToggle from "@/components/theme-toggle";
import Footer from "@/components/footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Contract Simplifier",
  description:
    "Upload a PDF and get a plain-English brief with risks & obligations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash (applies saved/system theme before hydration) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
          `.trim(),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen
          bg-gradient-to-b from-background via-secondary/20 to-muted
          text-foreground antialiased transition-colors duration-300`}
      >
        {/* Background FX */}
        <div className="bg-spotlight" />

        {/* ✅ New navbar at the top */}
        <Navbar />

        {/* Main page content */}
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <Footer/>

        {/* Floating theme toggle button */}
        <ThemeToggle />

        {/* Toast notifications */}
        <Toaster richColors theme="system" />
      </body>
    </html>
  );
}
