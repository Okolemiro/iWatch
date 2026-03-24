"use client";

import Link from "next/link";
import { Clock3, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { PosterTile } from "@/components/poster-tile";
import type { WatchlistItem } from "@/lib/data/watchlist";
import { formatYear } from "@/lib/utils";

type WatchlistGridProps = {
  items: WatchlistItem[];
};

export function WatchlistGrid({ items }: WatchlistGridProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAction(action: () => Promise<void>, id: string) {
    startTransition(async () => {
      setActiveId(id);
      setError(null);

      try {
        await action();
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Could not update watchlist.");
      } finally {
        setActiveId(null);
      }
    });
  }

  async function moveToLibrary(item: WatchlistItem) {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || "Could not add title to library.");
    }
  }

  async function removeFromWatchlist(watchlistItemId: string) {
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
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Your watchlist is empty"
        description="Use the dashboard search to save shows or movies for later."
        actionLabel="Back to dashboard"
      />
    );
  }

  return (
    <section className="space-y-5">
      {error ? (
        <div className="rounded-[1.5rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const href = item.mediaType === "movie" ? `/movies/${item.id}` : `/shows/${item.id}`;
          const isActive = activeId === item.id && isPending;

          return (
            <article key={item.id} className="panel overflow-hidden rounded-[2rem]">
              <div className="grid gap-5 p-5">
                <PosterTile path={item.posterPath} alt={item.title} className="aspect-[2/3] w-full" />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                      {item.mediaType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      <Clock3 className="size-3.5" />
                      Watchlist
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{item.title}</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {formatYear(item.releaseDateOrFirstAirDate) || "Unknown year"}
                    </p>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">{item.overview}</p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleAction(() => moveToLibrary(item), item.id)}
                      disabled={isActive}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="size-4" />
                      {isActive ? "Adding..." : "Move to library"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(() => removeFromWatchlist(item.id), item.id)}
                      disabled={isActive}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-center text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="size-4" />
                      Remove
                    </button>
                    <Link
                      href={href}
                      className="focus-ring inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2 text-center text-sm font-medium transition hover:bg-[var(--color-surface-strong)]"
                    >
                      Open details
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
