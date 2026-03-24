"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type RatingInputProps = {
  initialValue: number | null;
  label: string;
  onSave: (value: number | null) => Promise<void>;
};

export function RatingInput({ initialValue, label, onSave }: RatingInputProps) {
  const [value, setValue] = useState(initialValue?.toFixed(1) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit(nextValue: string) {
    startTransition(async () => {
      try {
        setError(null);
        await onSave(nextValue.trim() ? Number(nextValue) : null);
      } catch (commitError) {
        setError(commitError instanceof Error ? commitError.message : "Could not save rating.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max="10"
          step="0.1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => commit(value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder="1.0 - 10.0"
          className={cn(
            "focus-ring w-full rounded-2xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm",
            "border-[var(--color-border)] placeholder:text-[var(--color-text-muted)]",
          )}
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          disabled={isPending && !value}
          className="focus-ring rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
        >
          Clear
        </button>
      </div>
      {isPending ? <p className="text-xs text-[var(--color-text-muted)]">Saving...</p> : null}
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
