import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMovieDetails, getSeasonDetails, getTvDetails } from "@/lib/tmdb/client";
import { getStandardSeasons, mapMoviePayload, mapTvPayload } from "@/lib/tmdb/mappers";
import { parseNullableRating } from "@/lib/ratings";
import type { MediaType } from "@/lib/serializers";

type MediaTitleInput = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview: string;
  releaseDateOrFirstAirDate?: string | null;
  genresJson?: string;
};

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

async function getExistingMediaTitleId(tmdbId: number, mediaType: MediaType) {
  const { supabase } = await requireSupabaseUser();
  const { data, error } = await supabase
    .from("media_titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function ensureMediaTitle(input: MediaTitleInput) {
  const { supabase } = await requireSupabaseUser();
  const { data: existing, error: existingError } = await supabase
    .from("media_titles")
    .select("id")
    .eq("tmdb_id", input.tmdbId)
    .eq("media_type", input.mediaType)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("media_titles")
    .insert({
      tmdb_id: input.tmdbId,
      media_type: input.mediaType,
      title: input.title,
      poster_path: input.posterPath ?? null,
      backdrop_path: input.backdropPath ?? null,
      overview: input.overview,
      release_date_or_first_air_date: input.releaseDateOrFirstAirDate ?? null,
      genres_json: input.genresJson ? JSON.parse(input.genresJson) : [],
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const mediaTitleId = await getExistingMediaTitleId(input.tmdbId, input.mediaType);

      if (mediaTitleId) {
        return mediaTitleId;
      }
    }

    throw new Error(error.message);
  }

  return data.id;
}

async function ensureUserLibraryItem(userId: string, mediaTitleId: string) {
  const { supabase } = await requireSupabaseUser();
  const { data: existing, error: existingError } = await supabase
    .from("user_library_items")
    .select("id")
    .eq("user_id", userId)
    .eq("media_title_id", mediaTitleId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("user_library_items")
    .insert({
      user_id: userId,
      media_title_id: mediaTitleId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("user_library_items")
        .select("id")
        .eq("user_id", userId)
        .eq("media_title_id", mediaTitleId)
        .single();

      if (duplicateError) {
        throw new Error(duplicateError.message);
      }

      return duplicate;
    }

    throw new Error(error.message);
  }

  return data;
}

async function ensureUserWatchlistRemoval(userId: string, mediaTitleId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("user_watchlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("media_title_id", mediaTitleId);

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureMovieDetails(mediaTitleId: string, runtime: number | null) {
  const { supabase } = await requireSupabaseUser();
  const { data: existing, error: existingError } = await supabase
    .from("media_movie_details")
    .select("id")
    .eq("media_title_id", mediaTitleId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return;
  }

  const { error } = await supabase.from("media_movie_details").insert({
    media_title_id: mediaTitleId,
    runtime,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

async function ensureMovieTracking(userId: string, libraryItemId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase.from("user_movie_trackings").upsert(
    {
      user_id: userId,
      library_item_id: libraryItemId,
    },
    { onConflict: "library_item_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureTvShowDetails(mediaTitleId: string, totalSeasons: number) {
  const { supabase } = await requireSupabaseUser();
  const { data: existing, error: existingError } = await supabase
    .from("media_tv_show_details")
    .select("id")
    .eq("media_title_id", mediaTitleId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("media_tv_show_details")
    .insert({
      media_title_id: mediaTitleId,
      total_seasons: totalSeasons,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("media_tv_show_details")
        .select("id")
        .eq("media_title_id", mediaTitleId)
        .single();

      if (duplicateError) {
        throw new Error(duplicateError.message);
      }

      return duplicate.id;
    }

    throw new Error(error.message);
  }

  return data.id;
}

async function ensureTvHierarchy(
  userId: string,
  mediaTitleId: string,
  libraryItemId: string,
  payload: ReturnType<typeof mapTvPayload>,
) {
  const { supabase } = await requireSupabaseUser();
  const tvShowDetailsId = await ensureTvShowDetails(mediaTitleId, payload.totalSeasons);

  const { error: seasonsUpsertError } = await supabase.from("media_seasons").upsert(
    payload.seasons.map((season) => ({
      tv_show_details_id: tvShowDetailsId,
      season_number: season.seasonNumber,
      name: season.name,
      poster_path: season.posterPath,
      episode_count: season.episodeCount,
    })),
    { onConflict: "tv_show_details_id,season_number", ignoreDuplicates: true },
  );

  if (seasonsUpsertError) {
    throw new Error(seasonsUpsertError.message);
  }

  const { data: insertedSeasons, error: seasonSelectError } = await supabase
    .from("media_seasons")
    .select("id, season_number")
    .eq("tv_show_details_id", tvShowDetailsId);

  if (seasonSelectError || !insertedSeasons) {
    throw new Error(seasonSelectError?.message || "Could not load seasons.");
  }

  const seasonIdByNumber = new Map(insertedSeasons.map((season) => [season.season_number, season.id]));

  const episodeRows = payload.seasons.flatMap((season) =>
    season.episodes.map((episode) => ({
      season_id: seasonIdByNumber.get(season.seasonNumber)!,
      episode_number: episode.episodeNumber,
      name: episode.name,
      air_date: episode.airDate,
      runtime: episode.runtime,
    })),
  );

  if (episodeRows.length) {
    const { error: episodeUpsertError } = await supabase.from("media_episodes").upsert(episodeRows, {
      onConflict: "season_id,episode_number",
      ignoreDuplicates: true,
    });

    if (episodeUpsertError) {
      throw new Error(episodeUpsertError.message);
    }
  }

  const seasonIds = Array.from(seasonIdByNumber.values());
  const { data: insertedEpisodes, error: episodeSelectError } = await supabase
    .from("media_episodes")
    .select("id, season_id, episode_number")
    .in("season_id", seasonIds);

  if (episodeSelectError || !insertedEpisodes) {
    throw new Error(episodeSelectError?.message || "Could not load episodes.");
  }

  const episodeIdByKey = new Map(
    insertedEpisodes.map((episode) => [`${episode.season_id}:${episode.episode_number}`, episode.id]),
  );

  const { error: showTrackingError } = await supabase.from("user_show_trackings").upsert(
    {
      user_id: userId,
      library_item_id: libraryItemId,
    },
    { onConflict: "library_item_id", ignoreDuplicates: true },
  );

  if (showTrackingError) {
    throw new Error(showTrackingError.message);
  }

  const { error: seasonTrackingError } = await supabase.from("user_season_trackings").upsert(
    payload.seasons.map((season) => ({
      user_id: userId,
      season_id: seasonIdByNumber.get(season.seasonNumber)!,
    })),
    { onConflict: "user_id,season_id", ignoreDuplicates: true },
  );

  if (seasonTrackingError) {
    throw new Error(seasonTrackingError.message);
  }

  const episodeTrackingRows = payload.seasons.flatMap((season) =>
    season.episodes.map((episode) => ({
      user_id: userId,
      episode_id: episodeIdByKey.get(`${seasonIdByNumber.get(season.seasonNumber)!}:${episode.episodeNumber}`)!,
    })),
  );

  if (episodeTrackingRows.length) {
    const { error: episodeTrackingError } = await supabase.from("user_episode_trackings").upsert(
      episodeTrackingRows,
      { onConflict: "user_id,episode_id", ignoreDuplicates: true },
    );

    if (episodeTrackingError) {
      throw new Error(episodeTrackingError.message);
    }
  }
}

export async function addTitleToLibrary(tmdbId: number, mediaType: MediaType) {
  const { user } = await requireSupabaseUser();
  const existingMediaTitleId = await getExistingMediaTitleId(tmdbId, mediaType);

  if (existingMediaTitleId) {
    const existingLibraryItem = await ensureUserLibraryItem(user.id, existingMediaTitleId);

    if (mediaType === "movie") {
      const details = mapMoviePayload(await getMovieDetails(tmdbId));
      await ensureMovieDetails(existingMediaTitleId, details.runtime);
      await ensureMovieTracking(user.id, existingLibraryItem.id);
    } else {
      const showDetails = await getTvDetails(tmdbId);
      const seasons = getStandardSeasons(showDetails);
      const seasonDetails = await Promise.all(
        seasons.map((season) => getSeasonDetails(tmdbId, season.season_number)),
      );
      const payload = mapTvPayload(showDetails, seasonDetails);
      await ensureTvHierarchy(user.id, existingMediaTitleId, existingLibraryItem.id, payload);
    }

    await ensureUserWatchlistRemoval(user.id, existingMediaTitleId);
    return existingLibraryItem;
  }

  if (mediaType === "movie") {
    const details = mapMoviePayload(await getMovieDetails(tmdbId));
    const mediaTitleId = await ensureMediaTitle({
      tmdbId: details.tmdbId,
      mediaType,
      title: details.title,
      posterPath: details.posterPath,
      backdropPath: details.backdropPath,
      overview: details.overview,
      releaseDateOrFirstAirDate: details.releaseDateOrFirstAirDate,
      genresJson: details.genresJson,
    });
    const libraryItem = await ensureUserLibraryItem(user.id, mediaTitleId);

    await ensureMovieDetails(mediaTitleId, details.runtime);
    await ensureMovieTracking(user.id, libraryItem.id);
    await ensureUserWatchlistRemoval(user.id, mediaTitleId);

    return libraryItem;
  }

  const showDetails = await getTvDetails(tmdbId);
  const seasons = getStandardSeasons(showDetails);
  const seasonDetails = await Promise.all(
    seasons.map((season) => getSeasonDetails(tmdbId, season.season_number)),
  );
  const payload = mapTvPayload(showDetails, seasonDetails);
  const mediaTitleId = await ensureMediaTitle({
    tmdbId: payload.tmdbId,
    mediaType,
    title: payload.title,
    posterPath: payload.posterPath,
    backdropPath: payload.backdropPath,
    overview: payload.overview,
    releaseDateOrFirstAirDate: payload.releaseDateOrFirstAirDate,
    genresJson: payload.genresJson,
  });
  const libraryItem = await ensureUserLibraryItem(user.id, mediaTitleId);

  await ensureTvHierarchy(user.id, mediaTitleId, libraryItem.id, payload);
  await ensureUserWatchlistRemoval(user.id, mediaTitleId);

  return libraryItem;
}

export async function removeLibraryItem(libraryItemId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase.from("user_library_items").delete().eq("id", libraryItemId);

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
  const mediaTitleId = await ensureMediaTitle({
    tmdbId: input.tmdbId,
    mediaType: input.mediaType,
    title: input.title,
    posterPath: input.posterPath ?? null,
    backdropPath: input.backdropPath ?? null,
    overview: input.overview,
    releaseDateOrFirstAirDate: input.releaseDateOrFirstAirDate ?? null,
  });

  const { data: existingLibraryItem, error: existingLibraryError } = await supabase
    .from("user_library_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("media_title_id", mediaTitleId)
    .maybeSingle();

  if (existingLibraryError) {
    throw new Error(existingLibraryError.message);
  }

  if (existingLibraryItem) {
    throw new Error("This title is already in your library.");
  }

  const { data, error } = await supabase
    .from("user_watchlist_items")
    .insert({
      user_id: user.id,
      media_title_id: mediaTitleId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("user_watchlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("media_title_id", mediaTitleId)
        .single();

      if (duplicateError) {
        throw new Error(duplicateError.message);
      }

      return duplicate;
    }

    throw new Error(error.message);
  }

  return data;
}

export async function removeWatchlistItem(watchlistItemId: string) {
  const { supabase } = await requireSupabaseUser();
  const { error } = await supabase
    .from("user_watchlist_items")
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
    .from("user_movie_trackings")
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
    .from("user_show_trackings")
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
    .from("user_season_trackings")
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
    .from("user_episode_trackings")
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
    .from("media_episodes")
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
    .from("user_episode_trackings")
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
