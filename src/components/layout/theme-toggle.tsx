"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl bg-surface animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl",
        "bg-surface hover:bg-surface-hover",
        "border border-border/50",
        "transition-all duration-200 tap-scale",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === "dark" && (
        <Moon className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
      )}
      {theme === "light" && (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
      )}
      {theme === "system" && (
        <Monitor className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
      )}
    </button>
  );
}
