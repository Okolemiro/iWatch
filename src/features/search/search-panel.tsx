"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { PosterTile } from "@/components/poster-tile";
import { ErrorState } from "@/components/error-state";
import { formatYear } from "@/lib/utils";

type SearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDateOrFirstAirDate: string | null;
  inLibrary: boolean;
  inWatchlist: boolean;
};

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAddId, setActiveAddId] = useState<string | null>(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      startTransition(async () => {
        setError(null);

        try {
          const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });

          const payload = (await response.json()) as { results?: SearchResult[]; error?: string };

          if (!response.ok) {
            throw new Error(payload.error || "Search failed.");
          }

          setResults(payload.results ?? []);
        } catch (searchError) {
          if ((searchError as Error).name === "AbortError") {
            return;
          }

          setError(searchError instanceof Error ? searchError.message : "Search failed.");
        }
      });
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const hasQuery = query.trim().length >= 2;
  const heading = useMemo(() => (hasQuery ? "Search results" : "Search TMDb"), [hasQuery]);

  async function handleAdd(result: SearchResult) {
    setActiveAddId(`${result.mediaType}-${result.tmdbId}`);
    setError(null);

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: result.tmdbId,
          mediaType: result.mediaType,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not add this title.");
      }

      setResults((current) =>
        current.map((item) =>
          item.tmdbId === result.tmdbId && item.mediaType === result.mediaType
            ? { ...item, inLibrary: true, inWatchlist: false }
            : item,
        ),
      );
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add this title.");
    } finally {
      setActiveAddId(null);
    }
  }

  async function handleWatchlist(result: SearchResult) {
    setActiveWatchlistId(`${result.mediaType}-${result.tmdbId}`);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: result.tmdbId,
          mediaType: result.mediaType,
          title: result.title,
          posterPath: result.posterPath,
          backdropPath: result.backdropPath,
          overview: result.overview,
          releaseDateOrFirstAirDate: result.releaseDateOrFirstAirDate,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not add this title to your watchlist.");
      }

      setResults((current) =>
        current.map((item) =>
          item.tmdbId === result.tmdbId && item.mediaType === result.mediaType
            ? { ...item, inWatchlist: true }
            : item,
        ),
      );
    } catch (watchlistError) {
      setError(watchlistError instanceof Error ? watchlistError.message : "Could not add this title to your watchlist.");
    } finally {
      setActiveWatchlistId(null);
    }
  }

  return (
    <section className="panel rounded-[2rem] p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Search and add</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{heading}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Search TMDb for movies and TV shows, then add them to your library with one click.
          </p>
        </div>
      </div>

      <label className="mt-6 flex items-center gap-3 rounded-[1.6rem] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface)_94%,transparent)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <Search className="size-5 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a movie or TV show"
          className="focus-ring min-w-0 flex-1 bg-transparent text-base placeholder:text-[var(--color-text-muted)]"
          aria-label="Search TMDb"
        />
      </label>

      {error ? <div className="mt-5"><ErrorState title="Search unavailable" description={error} /></div> : null}

      {!hasQuery ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface)_36%,transparent)] p-8 text-sm text-[var(--color-text-muted)]">
          Start typing to search TMDb. Results include both movies and TV shows.
        </div>
      ) : null}

      {isPending && hasQuery ? <p className="mt-6 text-sm text-[var(--color-text-muted)]">Searching...</p> : null}

      {hasQuery && !isPending && !results.length && !error ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface)_36%,transparent)] p-8 text-sm text-[var(--color-text-muted)]">
          No titles found for this search. Try a broader title or a different year.
        </div>
      ) : null}

      {results.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {results.map((result) => {
            const addId = `${result.mediaType}-${result.tmdbId}`;

            return (
              <article key={addId} className="panel-muted grid grid-cols-[92px_1fr] gap-4 rounded-[1.7rem] p-4">
                <PosterTile path={result.posterPath} alt={result.title} className="aspect-[2/3] w-full" size="small" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                      {result.mediaType}
                    </span>
                    {result.inLibrary ? (
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                        In library
                      </span>
                    ) : null}
                    {result.inWatchlist && !result.inLibrary ? (
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                        In watchlist
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 truncate text-lg font-semibold tracking-tight">{result.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {formatYear(result.releaseDateOrFirstAirDate) || "Unknown year"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    {result.overview}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleAdd(result)}
                      disabled={result.inLibrary || activeAddId === addId}
                      className="focus-ring inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-4 py-2 text-center text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {result.inLibrary ? "Already added" : activeAddId === addId ? "Adding..." : "Add to library"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWatchlist(result)}
                      disabled={result.inLibrary || result.inWatchlist || activeWatchlistId === addId}
                      className="focus-ring inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2 text-center text-sm font-medium transition hover:bg-[var(--color-surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {result.inLibrary ? "Tracked" : result.inWatchlist ? "Saved" : activeWatchlistId === addId ? "Saving..." : "Save to watchlist"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
