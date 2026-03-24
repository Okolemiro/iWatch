"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ConfirmRemoveDialogProps = {
  libraryItemId: string;
  title: string;
};

export function ConfirmRemoveDialog({
  libraryItemId,
  title,
}: ConfirmRemoveDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      setError(null);

      const response = await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryItemId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "Could not remove this title.");
        return;
      }

      setOpen(false);
      router.push("/library");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring rounded-full border border-[var(--color-danger)]/35 px-4 py-2 text-sm font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
      >
        Remove from library
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="panel w-full max-w-md rounded-[2rem] p-6">
            <h2 className="text-xl font-semibold tracking-tight">Remove title?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              This will remove <span className="font-semibold text-[var(--color-text)]">{title}</span> and all
              associated tracking data.
            </p>
            {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="focus-ring rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
