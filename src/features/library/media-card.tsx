import Link from "next/link";
import { Star } from "lucide-react";
import { PosterTile } from "@/components/poster-tile";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import type { LibraryCardItem } from "@/features/library/types";
import { formatYear } from "@/lib/utils";

export function MediaCard({ item }: { item: LibraryCardItem }) {
  const href = item.href || (item.mediaType === "movie" ? `/movies/${item.id}` : `/shows/${item.id}`);

  return (
    <Link href={href} className="panel group overflow-hidden rounded-[2rem] transition hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(37,18,67,0.18)]">
      <div className="grid gap-5 p-5">
        <PosterTile path={item.posterPath} alt={item.title} className="aspect-[2/3] w-full" />

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  {item.metaLabel || item.mediaType}
                </span>
                {!item.metaLabel ? <StatusBadge status={item.status} /> : null}
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{formatYear(item.releaseDateOrFirstAirDate) || "TBA"}</p>
            </div>
            {item.rating ? (
              <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_84%,transparent)] px-3 py-1 text-sm font-semibold">
                <Star className="size-4 fill-current text-[var(--color-accent)]" />
                {item.rating.toFixed(1)}
              </div>
            ) : null}
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">{item.overview}</p>

          {!item.metaLabel && item.mediaType === "tv" ? (
            <ProgressBar
              value={item.progressPercentage}
              label={`${item.watchedEpisodes}/${item.totalEpisodes} episodes`}
            />
          ) : !item.metaLabel ? (
            <ProgressBar value={item.progressPercentage} label={item.watched ? "Watched" : "Not watched"} />
          ) : (
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Open details or move it into your collection when you&apos;re ready.</p>
          )}
        </div>
      </div>
    </Link>
  );
}
