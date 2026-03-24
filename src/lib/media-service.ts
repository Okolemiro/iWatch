import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMovieDetails, getSeasonDetails, getTvDetails } from "@/lib/tmdb/client";
import { getStandardSeasons, mapMoviePayload, mapTvPayload } from "@/lib/tmdb/mappers";
import { parseNullableRating } from "@/lib/ratings";
import type { MediaType } from "@/lib/serializers";

async function requireSupabaseUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return { supabase, user };
}

async function cleanupFailedInsert(libraryItemId: string | null) {
  if (!libraryItemId) {
    return;
  }

  const { supabase } = await requireSupabaseUser();
  await supabase.from("library_items").delete().eq("id", libraryItemId);
}

export async function addTitleToLibrary(tmdbId: number, mediaType: MediaType) {
  const { supabase, user } = await requireSupabaseUser();
  const { data: existing, error: existingError } = await supabase
    .from("library_items")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    await supabase
      .from("watchlist_items")
      .delete()
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    return existing;
  }

  let libraryItemId: string | null = null;

  try {
    if (mediaType === "movie") {
      const details = mapMoviePayload(await getMovieDetails(tmdbId));
      const { data: libraryItem, error: insertLibraryError } = await supabase
        .from("library_items")
        .insert({
          user_id: user.id,
          tmdb_id: details.tmdbId,
          media_type: mediaType,
          title: details.title,
          poster_path: details.posterPath,
          backdrop_path: details.backdropPath,
          overview: details.overview,
          release_date_or_first_air_date: details.releaseDateOrFirstAirDate,
          genres_json: JSON.parse(details.genresJson),
        })
        .select("id")
        .single();

      if (insertLibraryError) {
        throw insertLibraryError;
      }

      libraryItemId = libraryItem.id;

      const [{ error: detailError }, { error: trackingError }] = await Promise.all([
        supabase.from("movie_details").insert({
          library_item_id: libraryItem.id,
          runtime: details.runtime,
        }),
        supabase.from("movie_trackings").insert({
          user_id: user.id,
          library_item_id: libraryItem.id,
        }),
      ]);

      if (detailError || trackingError) {
        throw detailError || trackingError;
      }

      await supabase
        .from("watchlist_items")
        .delete()
        .eq("tmdb_id", details.tmdbId)
        .eq("media_type", mediaType);

      return libraryItem;
    }

    const showDetails = await getTvDetails(tmdbId);
    const seasons = getStandardSeasons(showDetails);
    const seasonDetails = await Promise.all(
      seasons.map((season) => getSeasonDetails(tmdbId, season.season_number)),
    );
    const payload = mapTvPayload(showDetails, seasonDetails);

    const { data: libraryItem, error: insertLibraryError } = await supabase
      .from("library_items")
      .insert({
        user_id: user.id,
        tmdb_id: payload.tmdbId,
        media_type: mediaType,
        title: payload.title,
        poster_path: payload.posterPath,
        backdrop_path: payload.backdropPath,
        overview: payload.overview,
        release_date_or_first_air_date: payload.releaseDateOrFirstAirDate,
        genres_json: JSON.parse(payload.genresJson),
      })
      .select("id")
      .single();

    if (insertLibraryError) {
      throw insertLibraryError;
    }

    libraryItemId = libraryItem.id;

    const [{ data: tvShowDetails, error: tvShowDetailsError }, { error: showTrackingError }] = await Promise.all([
      supabase
        .from("tv_show_details")
        .insert({
          library_item_id: libraryItem.id,
          total_seasons: payload.totalSeasons,
        })
        .select("id")
        .single(),
      supabase.from("show_trackings").insert({
        user_id: user.id,
        library_item_id: libraryItem.id,
      }),
    ]);

    if (tvShowDetailsError || showTrackingError || !tvShowDetails) {
      throw tvShowDetailsError || showTrackingError || new Error("Could not create TV show details.");
    }

    const { data: insertedSeasons, error: insertSeasonsError } = await supabase
      .from("seasons")
      .insert(
        payload.seasons.map((season) => ({
          tv_show_details_id: tvShowDetails.id,
          season_number: season.seasonNumber,
          name: season.name,
          poster_path: season.posterPath,
          episode_count: season.episodeCount,
        })),
      )
      .select("id, season_number");

    if (insertSeasonsError || !insertedSeasons) {
      throw insertSeasonsError || new Error("Could not create seasons.");
    }

    const seasonIdByNumber = new Map(insertedSeasons.map((season) => [season.season_number, season.id]));

    const { error: seasonTrackingError } = await supabase.from("season_trackings").insert(
      payload.seasons.map((season) => ({
        user_id: user.id,
        season_id: seasonIdByNumber.get(season.seasonNumber)!,
      })),
    );

    if (seasonTrackingError) {
      throw seasonTrackingError;
    }

    const episodeRows = payload.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        season_id: seasonIdByNumber.get(season.seasonNumber)!,
        episode_number: episode.episodeNumber,
        name: episode.name,
        air_date: episode.airDate,
        runtime: episode.runtime,
      })),
    );

    const { data: insertedEpisodes, error: insertEpisodesError } = await supabase
      .from("episodes")
      .insert(episodeRows)
      .select("id, season_id, episode_number");

    if (insertEpisodesError || !insertedEpisodes) {
      throw insertEpisodesError || new Error("Could not create episodes.");
    }

    const episodeIdByKey = new Map(
      insertedEpisodes.map((episode) => [`${episode.season_id}:${episode.episode_number}`, episode.id]),
    );

    const { error: episodeTrackingError } = await supabase.from("episode_trackings").insert(
      payload.seasons.flatMap((season) =>
        season.episodes.map((episode) => ({
          user_id: user.id,
          episode_id: episodeIdByKey.get(`${seasonIdByNumber.get(season.seasonNumber)!}:${episode.episodeNumber}`)!,
        })),
      ),
    );

    if (episodeTrackingError) {
      throw episodeTrackingError;
    }

    await supabase
      .from("watchlist_items")
      .delete()
      .eq("tmdb_id", payload.tmdbId)
      .eq("media_type", mediaType);

    return libraryItem;
  } catch (error) {
    await cleanupFailedInsert(libraryItemId);
    throw error;
  }
}

export async function removeLibraryItem(libraryItemId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase.from("library_items").delete().eq("id", libraryItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addTitleToWatchlist(input: {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview: string;
  releaseDateOrFirstAirDate?: string | null;
}) {
  const { supabase, user } = await requireSupabaseUser();

  const { data: existingLibraryItem, error: existingLibraryError } = await supabase
    .from("library_items")
    .select("id")
    .eq("tmdb_id", input.tmdbId)
    .eq("media_type", input.mediaType)
    .maybeSingle();

  if (existingLibraryError) {
    throw new Error(existingLibraryError.message);
  }

  if (existingLibraryItem) {
    throw new Error("This title is already in your library.");
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .upsert(
      {
        user_id: user.id,
        tmdb_id: input.tmdbId,
        media_type: input.mediaType,
        title: input.title,
        poster_path: input.posterPath ?? null,
        backdrop_path: input.backdropPath ?? null,
        overview: input.overview,
        release_date_or_first_air_date: input.releaseDateOrFirstAirDate ?? null,
      },
      { onConflict: "user_id,tmdb_id,media_type" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function removeWatchlistItem(watchlistItemId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", watchlistItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateMovieTracking(input: {
  libraryItemId: string;
  watched?: boolean;
  rating?: unknown;
}) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("movie_trackings")
    .update({
      watched: input.watched,
      user_rating: input.rating === undefined ? undefined : parseNullableRating(input.rating),
    })
    .eq("library_item_id", input.libraryItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateShowRating(libraryItemId: string, rating: unknown) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("show_trackings")
    .update({
      user_rating: parseNullableRating(rating),
    })
    .eq("library_item_id", libraryItemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSeasonRating(seasonId: string, rating: unknown) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("season_trackings")
    .update({
      user_rating: parseNullableRating(rating),
    })
    .eq("season_id", seasonId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateEpisodeTracking(input: {
  episodeId: string;
  watched?: boolean;
  rating?: unknown;
}) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("episode_trackings")
    .update({
      watched: input.watched,
      user_rating: input.rating === undefined ? undefined : parseNullableRating(input.rating),
    })
    .eq("episode_id", input.episodeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSeasonWatchedState(seasonId: string, watched: boolean) {
  const { supabase } = await requireSupabaseUser();
  const { data: episodes, error: episodeError } = await supabase
    .from("episodes")
    .select("id")
    .eq("season_id", seasonId);

  if (episodeError) {
    throw new Error(episodeError.message);
  }

  const episodeIds = episodes?.map((episode) => episode.id) ?? [];

  if (!episodeIds.length) {
    return;
  }

  const { error } = await supabase
    .from("episode_trackings")
    .update({ watched })
    .in("episode_id", episodeIds);

  if (error) {
    throw new Error(error.message);
  }
}

export function toMediaType(value: string): MediaType {
  if (value === "movie" || value === "tv") {
    return value;
  }

  throw new Error("Invalid media type");
}
