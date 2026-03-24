import type {
  TmdbMovieDetails,
  TmdbSearchResult,
  TmdbSeasonDetails,
  TmdbTvDetails,
} from "@/lib/tmdb/types";

export function mapSearchResult(result: TmdbSearchResult) {
  return {
    tmdbId: result.id,
    mediaType: result.media_type,
    title: result.title || result.name || "Untitled",
    posterPath: result.poster_path,
    backdropPath: result.backdrop_path,
    overview: result.overview || "No overview available.",
    releaseDateOrFirstAirDate: result.release_date || result.first_air_date || null,
  };
}

export function mapMoviePayload(details: TmdbMovieDetails) {
  return {
    tmdbId: details.id,
    title: details.title,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    overview: details.overview || "No overview available.",
    releaseDateOrFirstAirDate: details.release_date || null,
    genresJson: JSON.stringify(details.genres.map((genre) => genre.name)),
    runtime: details.runtime,
  };
}

export function getStandardSeasons(details: TmdbTvDetails) {
  return details.seasons.filter((season) => season.season_number > 0);
}

export function mapTvPayload(details: TmdbTvDetails, seasons: TmdbSeasonDetails[]) {
  return {
    tmdbId: details.id,
    title: details.name,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    overview: details.overview || "No overview available.",
    releaseDateOrFirstAirDate: details.first_air_date || null,
    genresJson: JSON.stringify(details.genres.map((genre) => genre.name)),
    totalSeasons: seasons.length,
    seasons: seasons.map((season) => ({
      seasonNumber: season.season_number,
      name: season.name || `Season ${season.season_number}`,
      posterPath: season.poster_path,
      episodeCount: season.episodes.length,
      episodes: season.episodes
        .filter((episode) => episode.episode_number > 0)
        .map((episode) => ({
          episodeNumber: episode.episode_number,
          name: episode.name || `Episode ${episode.episode_number}`,
          airDate: episode.air_date || null,
          runtime: episode.runtime || null,
        })),
    })),
  };
}
