"use client";

import { ChevronDown } from "lucide-react";
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
  const [openSeasons, setOpenSeasons] = useState<number[]>(seasons.map((season) => season.seasonNumber));

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

  function toggleSeason(seasonNumber: number) {
    setOpenSeasons((current) =>
      current.includes(seasonNumber)
        ? current.filter((value) => value !== seasonNumber)
        : [...current, seasonNumber],
    );
  }

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

      {seasons.map((season) => {
        const isOpen = openSeasons.includes(season.seasonNumber);

        return (
          <section key={season.id} className="panel rounded-[2rem] p-5 lg:p-6">
            <button
              type="button"
              onClick={() => toggleSeason(season.seasonNumber)}
              className="focus-ring flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Season {season.seasonNumber}: {season.name}
                  </h2>
                  <span className="rounded-full bg-[var(--color-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {season.episodeCount} episodes
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {season.watchedEpisodes}/{season.episodeCount} watched
                </p>
              </div>
              <ChevronDown className={`size-5 transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <ProgressBar value={season.progressPercentage} className="mt-5" />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => patch(`/api/seasons/${season.id}/watched`, { watched: true })}
                className="focus-ring rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Mark season watched
              </button>
              <button
                type="button"
                onClick={() => patch(`/api/seasons/${season.id}/watched`, { watched: false })}
                className="focus-ring rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Mark season unwatched
              </button>
            </div>

            <div className="mt-5 max-w-sm">
              <RatingInput
                key={season.rating?.toFixed(1) ?? `season-${season.id}-empty`}
                initialValue={season.rating}
                label={`Season ${season.seasonNumber} rating`}
                onSave={(value) => patch(`/api/seasons/${season.id}/tracking`, { rating: value })}
              />
            </div>

            {isOpen ? (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)]">
                <div className="grid grid-cols-[minmax(0,1.1fr)_120px_120px_140px] gap-4 bg-[var(--color-surface-strong)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  <span>Episode</span>
                  <span>Air date</span>
                  <span>Runtime</span>
                  <span>Tracking</span>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {season.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.1fr)_120px_120px_140px_220px]"
                    >
                      <div>
                        <p className="font-semibold">
                          {episode.episodeNumber}. {episode.name}
                        </p>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)]">{formatDate(episode.airDate)}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{formatRuntime(episode.runtime)}</p>
                      <button
                        type="button"
                        onClick={() =>
                          patch(`/api/episodes/${episode.id}/tracking`, {
                            watched: !episode.watched,
                          })
                        }
                        className="focus-ring rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
                      >
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
            ) : null}
          </section>
        );
      })}
    </section>
  );
}
