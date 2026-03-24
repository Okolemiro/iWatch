import type { LibraryCardItem } from "@/features/library/types";
import { getProgressPercentage, getProgressState } from "@/lib/progress";

export type MediaType = "movie" | "tv";

type EpisodeTrackingRow = {
  watched: boolean;
  user_rating: number | null;
};

type EpisodeRow = {
  id: string;
  episode_number: number;
  name: string;
  air_date: string | null;
  runtime: number | null;
  episode_trackings?: EpisodeTrackingRow[] | EpisodeTrackingRow | null;
};

type SeasonRow = {
  id: string;
  season_number: number;
  name: string;
  poster_path: string | null;
  episode_count: number;
  season_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
  episodes?: EpisodeRow[] | null;
};

type TvShowDetailsRow = {
  total_seasons: number;
  seasons?: SeasonRow[] | null;
};

export type LibraryItemRow = {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type: MediaType;
  release_date_or_first_air_date: string | null;
  genres_json: string[] | string | null;
  added_at: string;
  updated_at: string;
  movie_trackings?: { watched: boolean; user_rating: number | null }[] | { watched: boolean; user_rating: number | null } | null;
  show_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
  tv_show_details?: TvShowDetailsRow[] | TvShowDetailsRow | null;
};

export const libraryItemCardSelect = `
  id,
  tmdb_id,
  title,
  poster_path,
  backdrop_path,
  overview,
  media_type,
  release_date_or_first_air_date,
  genres_json,
  added_at,
  updated_at,
  movie_trackings(watched,user_rating),
  show_trackings(user_rating),
  tv_show_details(
    total_seasons,
    seasons(
      id,
      season_number,
      name,
      poster_path,
      episode_count,
      season_trackings(user_rating),
      episodes(
        id,
        episode_number,
        name,
        air_date,
        runtime,
        episode_trackings(watched,user_rating)
      )
    )
  )
`;

export function parseGenres(value: LibraryItemRow["genres_json"]) {
  if (Array.isArray(value)) {
    return value.filter((genre): genre is string => typeof genre === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((genre): genre is string => typeof genre === "string") : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function asArray<T>(value: T[] | T | null | undefined) {
  if (!value) {
    return [] as T[];
  }

  return Array.isArray(value) ? value : [value];
}

export function asSingle<T>(value: T[] | T | null | undefined) {
  return asArray(value)[0] ?? null;
}

export function serializeLibraryCard(item: LibraryItemRow): LibraryCardItem {
  const tvShowDetails = asSingle(item.tv_show_details);
  const seasons = asArray(tvShowDetails?.seasons);
  const episodes = seasons.flatMap((season) => asArray(season.episodes));
  const watchedEpisodes = episodes.filter((episode) => asSingle(episode.episode_trackings)?.watched).length;
  const totalEpisodes = episodes.length;
  const movieTracking = asSingle(item.movie_trackings);
  const showTracking = asSingle(item.show_trackings);
  const isMovie = item.media_type === "movie";

  const progressPercentage = isMovie
    ? movieTracking?.watched
      ? 100
      : 0
    : getProgressPercentage(watchedEpisodes, totalEpisodes);

  const status = isMovie
    ? movieTracking?.watched
      ? "completed"
      : "not-started"
    : getProgressState(watchedEpisodes, totalEpisodes);

  return {
    id: item.id,
    tmdbId: item.tmdb_id,
    title: item.title,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    overview: item.overview,
    mediaType: item.media_type,
    releaseDateOrFirstAirDate: item.release_date_or_first_air_date,
    genres: parseGenres(item.genres_json),
    addedAt: item.added_at,
    updatedAt: item.updated_at,
    progressPercentage,
    status,
    watchedEpisodes,
    totalEpisodes,
    rating: isMovie ? movieTracking?.user_rating ?? null : showTracking?.user_rating ?? null,
    watched: movieTracking?.watched ?? false,
  };
}
