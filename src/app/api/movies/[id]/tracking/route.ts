import { z } from "zod";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { updateMovieTracking } from "@/lib/media-service";

const schema = z.object({
  watched: z.boolean().optional(),
  rating: z.union([z.number(), z.null()]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();

    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const payload = schema.parse(await request.json());
    await updateMovieTracking({ libraryItemId: id, ...payload });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update movie tracking." },
      { status: 500 },
    );
  }
}
