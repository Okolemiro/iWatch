import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryItemCardSelect, serializeLibraryCard, type LibraryItemRow } from "@/lib/serializers";
import { getProgressPercentage } from "@/lib/progress";

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  const [{ data: libraryItems, error: itemsError }, { count: trackedMovies, error: moviesError }, { count: trackedShows, error: showsError }, { count: totalEpisodes, error: episodesError }, { count: watchedEpisodes, error: watchedError }] = await Promise.all([
    supabase
      .from("library_items")
      .select(libraryItemCardSelect)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("library_items")
      .select("*", { count: "exact", head: true })
      .eq("media_type", "movie"),
    supabase
      .from("library_items")
      .select("*", { count: "exact", head: true })
      .eq("media_type", "tv"),
    supabase.from("episodes").select("*", { count: "exact", head: true }),
    supabase
      .from("episode_trackings")
      .select("*", { count: "exact", head: true })
      .eq("watched", true),
  ]);

  if (itemsError || moviesError || showsError || episodesError || watchedError) {
    throw new Error(
      itemsError?.message ||
        moviesError?.message ||
        showsError?.message ||
        episodesError?.message ||
        watchedError?.message ||
        "Could not load dashboard data.",
    );
  }

  return {
    stats: {
      trackedMovies: trackedMovies ?? 0,
      trackedShows: trackedShows ?? 0,
      totalEpisodes: totalEpisodes ?? 0,
      watchedEpisodes: watchedEpisodes ?? 0,
      progressPercentage: getProgressPercentage(watchedEpisodes ?? 0, totalEpisodes ?? 0),
    },
    recentItems: (libraryItems as LibraryItemRow[] | null)?.map(serializeLibraryCard) ?? [],
  };
}
