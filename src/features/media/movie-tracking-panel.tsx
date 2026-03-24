"use client";

import { useRouter } from "next/navigation";
import { RatingInput } from "@/components/rating-input";

type MovieTrackingPanelProps = {
  libraryItemId: string;
  watched: boolean;
  rating: number | null;
};

export function MovieTrackingPanel({
  libraryItemId,
  watched,
  rating,
}: MovieTrackingPanelProps) {
  const router = useRouter();

  async function patchTracking(payload: Record<string, unknown>) {
    const response = await fetch(`/api/movies/${libraryItemId}/tracking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Could not update movie tracking.");
    }

    router.refresh();
  }

  return (
    <div className="panel rounded-[2rem] p-6">
      <h2 className="text-xl font-semibold tracking-tight">Your tracking</h2>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => patchTracking({ watched: !watched })}
          className="focus-ring rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
        >
          {watched ? "Mark unwatched" : "Mark watched"}
        </button>
        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
          {watched ? "Watched" : "Not watched"}
        </span>
      </div>

      <div className="mt-6">
        <RatingInput
          key={rating?.toFixed(1) ?? "empty"}
          initialValue={rating}
          label="Movie rating"
          onSave={(value) => patchTracking({ rating: value })}
        />
      </div>
    </div>
  );
}
