"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { MediaCard } from "@/features/library/media-card";
import { FilterSortBar } from "@/features/library/filter-sort-bar";
import type { LibraryCardItem } from "@/features/library/types";

type LibraryGridProps = {
  items: LibraryCardItem[];
};

export function LibraryGrid({ items }: LibraryGridProps) {
  const [mediaType, setMediaType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recently-updated");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextItems = items.filter((item) => {
      const typeMatch = mediaType === "all" || item.mediaType === mediaType;
      const statusMatch = status === "all" || item.status === status;
      const searchMatch =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.overview.toLowerCase().includes(normalizedQuery);
      return typeMatch && statusMatch && searchMatch;
    });

    nextItems.sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);
        case "recently-added":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "progress":
          return b.progressPercentage - a.progressPercentage;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return nextItems;
  }, [items, mediaType, query, sort, status]);

  return (
    <section className="space-y-6">
      <label className="flex items-center gap-3 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <Search className="size-4 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your library"
          className="focus-ring min-w-0 flex-1 bg-transparent text-sm placeholder:text-[var(--color-text-muted)]"
          aria-label="Search library"
        />
      </label>

      <FilterSortBar
        mediaType={mediaType}
        status={status}
        sort={sort}
        onChange={(next) => {
          if (next.mediaType) setMediaType(next.mediaType);
          if (next.status) setStatus(next.status);
          if (next.sort) setSort(next.sort);
        }}
      />

      {filteredItems.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No titles match these filters"
          description="Try a different media type, status, or sort option to surface more of your library."
        />
      )}
    </section>
  );
}
