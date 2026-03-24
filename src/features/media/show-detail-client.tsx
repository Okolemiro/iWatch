"use client";

import { Check, ChevronDown, Circle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/progress-bar";
import { RatingInput } from "@/components/rating-input";
import { formatDate, formatRuntime } from "@/lib/utils";

type ShowDetailsClientProps = {
  libraryItemId: string;
  rating: number | null;
  seasons: {
    id: string;
    seasonNumber: number;
    name: string;
    posterPath: string | null;
    episodeCount: number;
    progressPercentage: number;
    watchedEpisodes: number;
    rating: number | null;
    episodes: {
      id: string;
      episodeNumber: number;
      name: string;
      airDate: string | null;
      runtime: number | null;
      watched: boolean;
      rating: number | null;
    }[];
  }[];
};

export function ShowDetailClient({
  libraryItemId,
  rating,
  seasons,
}: ShowDetailsClientProps) {
  const router = useRouter();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(seasons[0]?.id ?? "");

  async function patch(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not save changes.");
    }

    router.refresh();
  }

  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? seasons[0];

  return (
    <section className="space-y-6">
      <div className="panel rounded-[2rem] p-6">
        <RatingInput
          key={rating?.toFixed(1) ?? "empty"}
          initialValue={rating}
          label="Show rating"
          onSave={(value) => patch(`/api/shows/${libraryItemId}/tracking`, { rating: value })}
        />
      </div>

      {selectedSeason ? (
        <section className="panel rounded-[2rem] p-5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="eyebrow">Season browser</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                Season {selectedSeason.seasonNumber}: {selectedSeason.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {selectedSeason.watchedEpisodes}/{selectedSeason.episodeCount} episodes watched
              </p>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text-muted)]">Choose season</span>
              <div className="relative">
                <select
                  value={selectedSeason.id}
                  onChange={(event) => setSelectedSeasonId(event.target.value)}
                  className="focus-ring w-full appearance-none rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-3 pr-11"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name.trim().toLowerCase() === `season ${season.seasonNumber}`.toLowerCase()
                        ? `Season ${season.seasonNumber}`
                        : `Season ${season.seasonNumber}: ${season.name}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>
            </label>
          </div>

          <ProgressBar value={selectedSeason.progressPercentage} className="mt-5" />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => patch(`/api/seasons/${selectedSeason.id}/watched`, { watched: true })}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-center text-sm font-semibold text-white"
            >
              <Check className="size-4" />
              Mark season watched
            </button>
            <button
              type="button"
              onClick={() => patch(`/api/seasons/${selectedSeason.id}/watched`, { watched: false })}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-center text-sm font-medium"
            >
              <Circle className="size-4" />
              Mark season unwatched
            </button>
          </div>

          <div className="mt-5 max-w-sm">
            <RatingInput
              key={selectedSeason.rating?.toFixed(1) ?? `season-${selectedSeason.id}-empty`}
              initialValue={selectedSeason.rating}
              label={`Season ${selectedSeason.seasonNumber} rating`}
              onSave={(value) => patch(`/api/seasons/${selectedSeason.id}/tracking`, { rating: value })}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)]">
            <div className="grid grid-cols-[minmax(0,1.1fr)_110px_100px_140px] gap-3 bg-[var(--color-surface-strong)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              <span>Episode</span>
              <span>Air date</span>
              <span>Runtime</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {selectedSeason.episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.1fr)_110px_100px_140px_200px]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {episode.episodeNumber}. {episode.name}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(episode.airDate)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatRuntime(episode.runtime)}</p>
                  <button
                    type="button"
                    onClick={() =>
                      patch(`/api/episodes/${episode.id}/tracking`, {
                        watched: !episode.watched,
                      })
                    }
                    className={`focus-ring inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-center text-xs font-medium transition ${
                      episode.watched
                        ? "bg-[var(--color-accent)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-strong)]"
                    }`}
                  >
                    {episode.watched ? <Check className="size-4" /> : <Circle className="size-4" />}
                    {episode.watched ? "Watched" : "Unwatched"}
                  </button>
                  <RatingInput
                    key={episode.rating?.toFixed(1) ?? `episode-${episode.id}-empty`}
                    initialValue={episode.rating}
                    label={`Episode ${episode.episodeNumber} rating`}
                    onSave={(value) =>
                      patch(`/api/episodes/${episode.id}/tracking`, {
                        rating: value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
