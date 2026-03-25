import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryItemCardSelect, serializeLibraryCard, type UserLibraryItemRow } from "@/lib/serializers";
import { getProgressPercentage } from "@/lib/progress";

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: recentLibraryItems, error: itemsError },
    { data: libraryMemberships, error: membershipsError },
    { count: totalEpisodes, error: episodesError },
    { count: watchedEpisodes, error: watchedError },
  ] = await Promise.all([
    supabase
      .from("user_library_items")
      .select(libraryItemCardSelect)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("user_library_items")
      .select("id, media_title:media_titles!inner(media_type)"),
    supabase.from("user_episode_trackings").select("*", { count: "exact", head: true }),
    supabase
      .from("user_episode_trackings")
      .select("*", { count: "exact", head: true })
      .eq("watched", true),
  ]);

  if (itemsError || membershipsError || episodesError || watchedError) {
    throw new Error(
      itemsError?.message ||
        membershipsError?.message ||
        episodesError?.message ||
        watchedError?.message ||
        "Could not load dashboard data.",
    );
  }

  const trackedMovies =
    libraryMemberships?.filter((item) => {
      const mediaTitle = Array.isArray(item.media_title) ? item.media_title[0] : item.media_title;
      return mediaTitle?.media_type === "movie";
    }).length ?? 0;

  const trackedShows =
    libraryMemberships?.filter((item) => {
      const mediaTitle = Array.isArray(item.media_title) ? item.media_title[0] : item.media_title;
      return mediaTitle?.media_type === "tv";
    }).length ?? 0;

  return {
    stats: {
      trackedMovies: trackedMovies ?? 0,
      trackedShows: trackedShows ?? 0,
      totalEpisodes: totalEpisodes ?? 0,
      watchedEpisodes: watchedEpisodes ?? 0,
      progressPercentage: getProgressPercentage(watchedEpisodes ?? 0, totalEpisodes ?? 0),
    },
    recentItems: (recentLibraryItems as UserLibraryItemRow[] | null)?.map(serializeLibraryCard) ?? [],
  };
}
