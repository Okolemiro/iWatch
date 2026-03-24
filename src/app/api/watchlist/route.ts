import { z } from "zod";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { addTitleToWatchlist, removeWatchlistItem, toMediaType } from "@/lib/media-service";

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.string(),
  title: z.string().min(1),
  posterPath: z.string().nullable().optional(),
  backdropPath: z.string().nullable().optional(),
  overview: z.string(),
  releaseDateOrFirstAirDate: z.string().nullable().optional(),
});

const removeSchema = z.object({
  watchlistItemId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();

    if (auth.response) {
      return auth.response;
    }

    const payload = addSchema.parse(await request.json());
    const item = await addTitleToWatchlist({
      ...payload,
      mediaType: toMediaType(payload.mediaType),
    });

    return NextResponse.json({ id: item.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add title to watchlist." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireApiUser();

    if (auth.response) {
      return auth.response;
    }

    const payload = removeSchema.parse(await request.json());
    await removeWatchlistItem(payload.watchlistItemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove title from watchlist." },
      { status: 500 },
    );
  }
}
