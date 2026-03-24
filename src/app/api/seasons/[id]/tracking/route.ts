import { z } from "zod";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { updateSeasonRating } from "@/lib/media-service";

const schema = z.object({
  rating: z.union([z.number(), z.null()]),
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
    await updateSeasonRating(id, payload.rating);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update season rating." },
      { status: 500 },
    );
  }
}
