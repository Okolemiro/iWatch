import type { ProgressState } from "@/lib/progress";

export type LibraryCardItem = {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  mediaType: "movie" | "tv";
  releaseDateOrFirstAirDate: string | null;
  genres: string[];
  addedAt: string;
  updatedAt: string;
  progressPercentage: number;
  status: ProgressState;
  watchedEpisodes: number;
  totalEpisodes: number;
  rating: number | null;
  watched: boolean;
  href?: string;
  metaLabel?: string;
};
