import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getMovieDetails, getSeasonDetails, getTvDetails } from "@/lib/tmdb/client";
import { getStandardSeasons, mapMoviePayload, mapTvPayload } from "@/lib/tmdb/mappers";
import { getProgressPercentage } from "@/lib/progress";

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

export async function getWatchlistItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id, tmdb_id, media_type, title, poster_path, backdrop_path, overview, release_date_or_first_air_date, added_at")
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    tmdbId: item.tmdb_id,
    mediaType: item.media_type,
    title: item.title,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    overview: item.overview,
    releaseDateOrFirstAirDate: item.release_date_or_first_air_date,
    addedAt: item.added_at,
  })) satisfies WatchlistItem[];
}

export async function getWatchlistItemByTmdbId(tmdbId: number, mediaType: "movie" | "tv") {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id, tmdb_id, media_type, title, poster_path, backdrop_path, overview, release_date_or_first_air_date")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  return {
    id: data.id,
    tmdbId: data.tmdb_id,
    mediaType: data.media_type,
    title: data.title,
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    overview: data.overview,
    releaseDateOrFirstAirDate: data.release_date_or_first_air_date,
  };
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
