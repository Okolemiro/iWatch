export type TmdbSearchMediaType = "movie" | "tv";

export type TmdbSearchResult = {
  id: number;
  media_type: TmdbSearchMediaType;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbMovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: TmdbGenre[];
};

export type TmdbTvSeasonSummary = {
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string | null;
};

export type TmdbTvDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  genres: TmdbGenre[];
  number_of_seasons: number;
  seasons: TmdbTvSeasonSummary[];
};

export type TmdbSeasonEpisode = {
  episode_number: number;
  name: string;
  air_date: string | null;
  runtime: number | null;
};

export type TmdbSeasonDetails = {
  id: number;
  name: string;
  season_number: number;
  poster_path: string | null;
  episodes: TmdbSeasonEpisode[];
};
