import { z } from "zod";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { addTitleToLibrary, removeLibraryItem, toMediaType } from "@/lib/media-service";

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.string(),
});

const removeSchema = z.object({
  libraryItemId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();

    if (auth.response) {
      return auth.response;
    }

    const payload = addSchema.parse(await request.json());
    const item = await addTitleToLibrary(payload.tmdbId, toMediaType(payload.mediaType));
    return NextResponse.json({ id: item.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add title." },
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
    await removeLibraryItem(payload.libraryItemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove title." },
      { status: 500 },
    );
  }
}
