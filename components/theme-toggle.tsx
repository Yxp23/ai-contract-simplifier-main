'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { MotionButton } from '@/components/anim';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

function applyTheme(t: Theme) {
  const root = document.documentElement; // <html>
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  // Initialize from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const systemDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial: Theme = stored ?? (systemDark ? 'dark' : 'light');
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <MotionButton>
      <Button
        onClick={toggle}
        size="icon"
        variant="outline"
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="fixed right-4 bottom-4 z-40 rounded-full border-border/60 bg-card/80 backdrop-blur
                   shadow-lg hover:shadow-[0_8px_30px_-12px_var(--color-primary)]
                   transition-shadow"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </MotionButton>
  );
}