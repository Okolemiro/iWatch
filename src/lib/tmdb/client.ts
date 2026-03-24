import { assertTmdbApiKey } from "@/lib/env";
import type {
  TmdbMovieDetails,
  TmdbSearchResult,
  TmdbSeasonDetails,
  TmdbTvDetails,
} from "@/lib/tmdb/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type FetchOptions = {
  revalidate?: number;
};

async function tmdbFetch<T>(path: string, options?: FetchOptions): Promise<T> {
  const apiKey = assertTmdbApiKey();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE_URL}${path}${separator}api_key=${apiKey}`;

  const response = await fetch(url, {
    next: options?.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`TMDb request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

export async function searchTmdb(query: string) {
  const encodedQuery = encodeURIComponent(query.trim());

  const response = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    `/search/multi?query=${encodedQuery}&include_adult=false&language=en-US&page=1`,
  );

  return response.results.filter(
    (result): result is TmdbSearchResult =>
      result.media_type === "movie" || result.media_type === "tv",
  );
}

export function getMovieDetails(tmdbId: number) {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}?language=en-US`);
}

export function getTvDetails(tmdbId: number) {
  return tmdbFetch<TmdbTvDetails>(`/tv/${tmdbId}?language=en-US`);
}

export function getSeasonDetails(tmdbId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeasonDetails>(
    `/tv/${tmdbId}/season/${seasonNumber}?language=en-US`,
  );
}
