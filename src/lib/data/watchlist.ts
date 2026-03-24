import { createSupabaseServerClient } from "@/lib/supabase/server";

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
