"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type WatchlistDetailActionsProps = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  watchlistItemId: string;
};

export function WatchlistDetailActions({
  tmdbId,
  mediaType,
  watchlistItemId,
}: WatchlistDetailActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function moveToLibrary() {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId,
        mediaType,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || "Could not move title to your library.");
    }

    const destination = mediaType === "movie" ? `/movies/${payload?.id}` : `/shows/${payload?.id}`;
    router.push(destination);
    router.refresh();
  }

  async function removeFromWatchlist() {
    const response = await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlistItemId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || "Could not remove title from watchlist.");
    }

    router.push("/watchlist");
    router.refresh();
  }

  function handleAction(action: () => Promise<void>) {
    startTransition(async () => {
      setError(null);

      try {
        await action();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Could not update watchlist.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="panel rounded-[2rem] p-6">
        <h2 className="text-xl font-semibold tracking-tight">Watchlist actions</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Move this title into your tracked collection when you are ready, or remove it from the watchlist.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleAction(moveToLibrary)}
            disabled={isPending}
            className="focus-ring inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Working..." : "Move to library"}
          </button>
          <button
            type="button"
            onClick={() => handleAction(removeFromWatchlist)}
            disabled={isPending}
            className="focus-ring inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2 text-center text-sm font-medium transition hover:bg-[var(--color-surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove from watchlist
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
