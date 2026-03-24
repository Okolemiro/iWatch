"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "focus-ring inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
        "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-strong)]",
      )}
      aria-label="Toggle theme"
    >
      {isDark ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
      <span>Toggle theme</span>
    </button>
  );
}
