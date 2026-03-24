import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asArray, asSingle, parseGenres } from "@/lib/serializers";
import { getProgressPercentage } from "@/lib/progress";

export async function getMovieDetailsPageData(libraryItemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_items")
    .select(`
      id,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_date_or_first_air_date,
      genres_json,
      movie_details(runtime),
      movie_trackings(watched,user_rating)
    `)
    .eq("id", libraryItemId)
    .eq("media_type", "movie")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  return {
    id: data.id,
    title: data.title,
    overview: data.overview,
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    releaseDate: data.release_date_or_first_air_date,
    genres: parseGenres(data.genres_json),
    runtime: asSingle(data.movie_details)?.runtime ?? null,
    watched: asSingle(data.movie_trackings)?.watched ?? false,
    rating: asSingle(data.movie_trackings)?.user_rating ?? null,
  };
}

export async function getShowDetailsPageData(libraryItemId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_items")
    .select(`
      id,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_date_or_first_air_date,
      genres_json,
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
    `)
    .eq("id", libraryItemId)
    .eq("media_type", "tv")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const tvShowDetails = asSingle(data.tv_show_details);
  const seasons = asArray(tvShowDetails?.seasons)
    .sort((a, b) => a.season_number - b.season_number)
    .map((season) => {
      const episodes = asArray(season.episodes).sort((a, b) => a.episode_number - b.episode_number);
      const watchedEpisodes = episodes.filter((episode) => asSingle(episode.episode_trackings)?.watched).length;

      return {
        id: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        posterPath: season.poster_path,
        episodeCount: season.episode_count,
        progressPercentage: getProgressPercentage(watchedEpisodes, episodes.length),
        watchedEpisodes,
        rating: asSingle(season.season_trackings)?.user_rating ?? null,
        episodes: episodes.map((episode) => ({
          id: episode.id,
          episodeNumber: episode.episode_number,
          name: episode.name,
          airDate: episode.air_date,
          runtime: episode.runtime,
          watched: asSingle(episode.episode_trackings)?.watched ?? false,
          rating: asSingle(episode.episode_trackings)?.user_rating ?? null,
        })),
      };
    });

  const totalEpisodes = seasons.reduce((sum, season) => sum + season.episodes.length, 0);
  const watchedEpisodes = seasons.reduce((sum, season) => sum + season.watchedEpisodes, 0);

  return {
    id: data.id,
    title: data.title,
    overview: data.overview,
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    firstAirDate: data.release_date_or_first_air_date,
    genres: parseGenres(data.genres_json),
    totalSeasons: tvShowDetails?.total_seasons ?? 0,
    rating: asSingle(data.show_trackings)?.user_rating ?? null,
    progressPercentage: getProgressPercentage(watchedEpisodes, totalEpisodes),
    watchedEpisodes,
    totalEpisodes,
    seasons,
  };
}
