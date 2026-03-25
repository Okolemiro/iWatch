import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { searchTmdb } from "@/lib/tmdb/client";
import { mapSearchResult } from "@/lib/tmdb/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const auth = await requireApiUser();

    if (auth.response) {
      return auth.response;
    }

    const [results, libraryItems, watchlistItems] = await Promise.all([
      searchTmdb(query),
      auth.supabase.from("user_library_items").select("media_title:media_titles!inner(tmdb_id, media_type)"),
      auth.supabase.from("user_watchlist_items").select("media_title:media_titles!inner(tmdb_id, media_type)"),
    ]);

    const libraryItemsData = libraryItems.data ?? [];
    const libraryItemsError = libraryItems.error;
    const watchlistItemsData = watchlistItems.data ?? [];
    const watchlistItemsError = watchlistItems.error;

    if (libraryItemsError || watchlistItemsError) {
      throw new Error(libraryItemsError?.message || watchlistItemsError?.message);
    }

    const librarySet = new Set(
      libraryItemsData.map((item) => {
        const mediaTitle = Array.isArray(item.media_title) ? item.media_title[0] : item.media_title;
        return `${mediaTitle?.media_type}-${mediaTitle?.tmdb_id}`;
      }),
    );
    const watchlistSet = new Set(
      watchlistItemsData.map((item) => {
        const mediaTitle = Array.isArray(item.media_title) ? item.media_title[0] : item.media_title;
        return `${mediaTitle?.media_type}-${mediaTitle?.tmdb_id}`;
      }),
    );

    return NextResponse.json({
      results: results.map((result) => {
        const mapped = mapSearchResult(result);
        return {
          ...mapped,
          inLibrary: librarySet.has(`${mapped.mediaType}-${mapped.tmdbId}`),
          inWatchlist: watchlistSet.has(`${mapped.mediaType}-${mapped.tmdbId}`),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed.",
      },
      { status: 500 },
    );
  }
}
