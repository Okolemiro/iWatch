import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getMovieDetails, getSeasonDetails, getTvDetails } from "@/lib/tmdb/client";
import { getStandardSeasons, mapMoviePayload, mapTvPayload } from "@/lib/tmdb/mappers";
import { getProgressPercentage } from "@/lib/progress";
import { asSingle } from "@/lib/serializers";

type WatchlistMediaTitleRow = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date_or_first_air_date: string | null;
  genres_json: string[] | string | null;
};

type UserWatchlistItemRow = {
  id: string;
  added_at: string;
  media_title: WatchlistMediaTitleRow | WatchlistMediaTitleRow[] | null;
};

export type WatchlistItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDateOrFirstAirDate: string | null;
  addedAt: string;
};

const watchlistSelect = `
  id,
  added_at,
  media_title:media_titles!inner(
    tmdb_id,
    media_type,
    title,
    poster_path,
    backdrop_path,
    overview,
    release_date_or_first_air_date,
    genres_json
  )
`;

function serializeWatchlistItem(item: UserWatchlistItemRow): WatchlistItem {
  const mediaTitle = asSingle(item.media_title);

  if (!mediaTitle) {
    throw new Error("Watchlist item is missing its media title.");
  }

  return {
    id: item.id,
    tmdbId: mediaTitle.tmdb_id,
    mediaType: mediaTitle.media_type,
    title: mediaTitle.title,
    posterPath: mediaTitle.poster_path,
    backdropPath: mediaTitle.backdrop_path,
    overview: mediaTitle.overview,
    releaseDateOrFirstAirDate: mediaTitle.release_date_or_first_air_date,
    addedAt: item.added_at,
  };
}

export async function getWatchlistItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_watchlist_items")
    .select(watchlistSelect)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserWatchlistItemRow[] | null)?.map(serializeWatchlistItem) ?? [];
}

export async function getWatchlistItemByTmdbId(tmdbId: number, mediaType: "movie" | "tv") {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_watchlist_items")
    .select(watchlistSelect)
    .eq("media_titles.tmdb_id", tmdbId)
    .eq("media_titles.media_type", mediaType)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  return serializeWatchlistItem(data as UserWatchlistItemRow);
}

export async function getWatchlistMovieDetailsPageData(tmdbId: number) {
  const watchlistItem = await getWatchlistItemByTmdbId(tmdbId, "movie");
  const details = mapMoviePayload(await getMovieDetails(tmdbId));

  return {
    ...watchlistItem,
    title: details.title,
    overview: details.overview,
    posterPath: details.posterPath,
    backdropPath: details.backdropPath,
    releaseDate: details.releaseDateOrFirstAirDate,
    genres: JSON.parse(details.genresJson) as string[],
    runtime: details.runtime,
  };
}

export async function getWatchlistShowDetailsPageData(tmdbId: number) {
  const watchlistItem = await getWatchlistItemByTmdbId(tmdbId, "tv");
  const showDetails = await getTvDetails(tmdbId);
  const seasons = getStandardSeasons(showDetails);
  const seasonDetails = await Promise.all(
    seasons.map((season) => getSeasonDetails(tmdbId, season.season_number)),
  );
  const payload = mapTvPayload(showDetails, seasonDetails);

  const mappedSeasons = payload.seasons.map((season) => ({
    seasonNumber: season.seasonNumber,
    name: season.name,
    episodeCount: season.episodeCount,
    progressPercentage: getProgressPercentage(0, season.episodeCount),
  }));

  const totalEpisodes = mappedSeasons.reduce((sum, season) => sum + season.episodeCount, 0);

  return {
    ...watchlistItem,
    title: payload.title,
    overview: payload.overview,
    posterPath: payload.posterPath,
    backdropPath: payload.backdropPath,
    firstAirDate: payload.releaseDateOrFirstAirDate,
    genres: JSON.parse(payload.genresJson) as string[],
    totalSeasons: payload.totalSeasons,
    totalEpisodes,
    seasons: mappedSeasons,
  };
}
