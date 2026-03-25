import type { LibraryCardItem } from "@/features/library/types";
import { getProgressPercentage, getProgressState } from "@/lib/progress";

export type MediaType = "movie" | "tv";

type UserEpisodeTrackingRow = {
  watched: boolean;
  user_rating: number | null;
};

type MediaEpisodeRow = {
  id: string;
  episode_number: number;
  name: string;
  air_date: string | null;
  runtime: number | null;
  user_episode_trackings?: UserEpisodeTrackingRow[] | UserEpisodeTrackingRow | null;
};

type MediaSeasonRow = {
  id: string;
  season_number: number;
  name: string;
  poster_path: string | null;
  episode_count: number;
  user_season_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
  media_episodes?: MediaEpisodeRow[] | null;
};

type MediaTvShowDetailsRow = {
  total_seasons: number;
  media_seasons?: MediaSeasonRow[] | null;
};

type MediaTitleRow = {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type: MediaType;
  release_date_or_first_air_date: string | null;
  genres_json: string[] | string | null;
  media_movie_details?: { runtime: number | null }[] | { runtime: number | null } | null;
  media_tv_show_details?: MediaTvShowDetailsRow[] | MediaTvShowDetailsRow | null;
};

export type UserLibraryItemRow = {
  id: string;
  added_at: string;
  updated_at: string;
  media_title: MediaTitleRow | MediaTitleRow[] | null;
  user_movie_trackings?: { watched: boolean; user_rating: number | null }[] | { watched: boolean; user_rating: number | null } | null;
  user_show_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
};

export const libraryItemCardSelect = `
  id,
  added_at,
  updated_at,
  media_title:media_titles!inner(
    id,
    tmdb_id,
    title,
    poster_path,
    backdrop_path,
    overview,
    media_type,
    release_date_or_first_air_date,
    genres_json,
    media_movie_details(runtime),
    media_tv_show_details(
      total_seasons,
      media_seasons(
        id,
        season_number,
        name,
        poster_path,
        episode_count,
        user_season_trackings(user_rating),
        media_episodes(
          id,
          episode_number,
          name,
          air_date,
          runtime,
          user_episode_trackings(watched,user_rating)
        )
      )
    )
  ),
  user_movie_trackings(watched,user_rating),
  user_show_trackings(user_rating)
`;

export function parseGenres(value: MediaTitleRow["genres_json"]) {
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

export function serializeLibraryCard(item: UserLibraryItemRow): LibraryCardItem {
  const mediaTitle = asSingle(item.media_title);

  if (!mediaTitle) {
    throw new Error("Library item is missing its media title.");
  }

  const tvShowDetails = asSingle(mediaTitle.media_tv_show_details);
  const seasons = asArray(tvShowDetails?.media_seasons);
  const episodes = seasons.flatMap((season) => asArray(season.media_episodes));
  const watchedEpisodes = episodes.filter((episode) => asSingle(episode.user_episode_trackings)?.watched).length;
  const totalEpisodes = episodes.length;
  const movieTracking = asSingle(item.user_movie_trackings);
  const showTracking = asSingle(item.user_show_trackings);
  const isMovie = mediaTitle.media_type === "movie";

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
    tmdbId: mediaTitle.tmdb_id,
    title: mediaTitle.title,
    posterPath: mediaTitle.poster_path,
    backdropPath: mediaTitle.backdrop_path,
    overview: mediaTitle.overview,
    mediaType: mediaTitle.media_type,
    releaseDateOrFirstAirDate: mediaTitle.release_date_or_first_air_date,
    genres: parseGenres(mediaTitle.genres_json),
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
