import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asArray, asSingle, parseGenres } from "@/lib/serializers";
import { getProgressPercentage } from "@/lib/progress";
import { getMovieDetails, getTvDetails } from "@/lib/tmdb/client";

type DetailMediaTitleRow = {
  id: string;
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date_or_first_air_date: string | null;
  genres_json: string[] | string | null;
  media_movie_details?: { runtime: number | null }[] | { runtime: number | null } | null;
  media_tv_show_details?: {
    total_seasons: number;
    media_seasons?: {
      id: string;
      season_number: number;
      name: string;
      poster_path: string | null;
      episode_count: number;
      user_season_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
      media_episodes?: {
        id: string;
        episode_number: number;
        name: string;
        air_date: string | null;
        runtime: number | null;
        user_episode_trackings?: { watched: boolean; user_rating: number | null }[] | { watched: boolean; user_rating: number | null } | null;
      }[] | null;
    }[] | null;
  }[] | {
    total_seasons: number;
    media_seasons?: {
      id: string;
      season_number: number;
      name: string;
      poster_path: string | null;
      episode_count: number;
      user_season_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
      media_episodes?: {
        id: string;
        episode_number: number;
        name: string;
        air_date: string | null;
        runtime: number | null;
        user_episode_trackings?: { watched: boolean; user_rating: number | null }[] | { watched: boolean; user_rating: number | null } | null;
      }[] | null;
    }[] | null;
  } | null;
};

type UserLibraryDetailRow = {
  id: string;
  media_title: DetailMediaTitleRow | DetailMediaTitleRow[] | null;
  user_movie_trackings?: { watched: boolean; user_rating: number | null }[] | { watched: boolean; user_rating: number | null } | null;
  user_show_trackings?: { user_rating: number | null }[] | { user_rating: number | null } | null;
};

export async function getMovieDetailsPageData(libraryItemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_library_items")
    .select(`
      id,
      media_title:media_titles!inner(
        id,
        tmdb_id,
        title,
        overview,
        poster_path,
        backdrop_path,
        release_date_or_first_air_date,
        genres_json,
        media_movie_details(runtime)
      ),
      user_movie_trackings(watched,user_rating)
    `)
    .eq("id", libraryItemId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const mediaTitle = asSingle((data as UserLibraryDetailRow).media_title);

  if (!mediaTitle?.media_movie_details) {
    notFound();
  }

  const genres = parseGenres(mediaTitle.genres_json);
  const fallbackMovieDetails = genres.length ? null : await getMovieDetails(mediaTitle.tmdb_id).catch(() => null);

  return {
    id: data.id,
    title: mediaTitle.title,
    overview: mediaTitle.overview,
    posterPath: mediaTitle.poster_path,
    backdropPath: mediaTitle.backdrop_path,
    releaseDate: mediaTitle.release_date_or_first_air_date,
    genres: genres.length
      ? genres
      : fallbackMovieDetails?.genres.map((genre) => genre.name) ?? [],
    runtime: asSingle(mediaTitle.media_movie_details)?.runtime ?? null,
    watched: asSingle((data as UserLibraryDetailRow).user_movie_trackings)?.watched ?? false,
    rating: asSingle((data as UserLibraryDetailRow).user_movie_trackings)?.user_rating ?? null,
  };
}

export async function getShowDetailsPageData(libraryItemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_library_items")
    .select(`
      id,
      media_title:media_titles!inner(
        id,
        tmdb_id,
        title,
        overview,
        poster_path,
        backdrop_path,
        release_date_or_first_air_date,
        genres_json,
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
      user_show_trackings(user_rating)
    `)
    .eq("id", libraryItemId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const mediaTitle = asSingle((data as UserLibraryDetailRow).media_title);
  const tvShowDetails = asSingle(mediaTitle?.media_tv_show_details);

  if (!mediaTitle || !tvShowDetails) {
    notFound();
  }

  const seasons = asArray(tvShowDetails.media_seasons)
    .sort((a, b) => a.season_number - b.season_number)
    .map((season) => {
      const episodes = asArray(season.media_episodes).sort((a, b) => a.episode_number - b.episode_number);
      const watchedEpisodes = episodes.filter((episode) => asSingle(episode.user_episode_trackings)?.watched).length;

      return {
        id: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        posterPath: season.poster_path,
        episodeCount: season.episode_count,
        progressPercentage: getProgressPercentage(watchedEpisodes, episodes.length),
        watchedEpisodes,
        rating: asSingle(season.user_season_trackings)?.user_rating ?? null,
        episodes: episodes.map((episode) => ({
          id: episode.id,
          episodeNumber: episode.episode_number,
          name: episode.name,
          airDate: episode.air_date,
          runtime: episode.runtime,
          watched: asSingle(episode.user_episode_trackings)?.watched ?? false,
          rating: asSingle(episode.user_episode_trackings)?.user_rating ?? null,
        })),
      };
    });

  const totalEpisodes = seasons.reduce((sum, season) => sum + season.episodes.length, 0);
  const watchedEpisodes = seasons.reduce((sum, season) => sum + season.watchedEpisodes, 0);
  const genres = parseGenres(mediaTitle.genres_json);
  const fallbackShowDetails = genres.length ? null : await getTvDetails(mediaTitle.tmdb_id).catch(() => null);

  return {
    id: data.id,
    title: mediaTitle.title,
    overview: mediaTitle.overview,
    posterPath: mediaTitle.poster_path,
    backdropPath: mediaTitle.backdrop_path,
    firstAirDate: mediaTitle.release_date_or_first_air_date,
    genres: genres.length
      ? genres
      : fallbackShowDetails?.genres.map((genre) => genre.name) ?? [],
    totalSeasons: tvShowDetails.total_seasons ?? 0,
    rating: asSingle((data as UserLibraryDetailRow).user_show_trackings)?.user_rating ?? null,
    progressPercentage: getProgressPercentage(watchedEpisodes, totalEpisodes),
    watchedEpisodes,
    totalEpisodes,
    seasons,
  };
}
