import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LibraryGrid } from "@/features/library/library-grid";
import { requireUser } from "@/lib/auth";
import { getLibraryItems } from "@/lib/data/library";

export default async function LibraryPage() {
  await requireUser("/library");
  const items = await getLibraryItems();

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section className="space-y-3">
          <p className="eyebrow">Library</p>
          <h1 className="text-4xl font-semibold tracking-tight">All tracked titles</h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
            Filter by media type, progress state, or recent activity to focus on what to watch next.
          </p>
        </section>

        {items.length ? (
          <LibraryGrid items={items} />
        ) : (
          <EmptyState
            title="No titles in your library yet"
            description="Use the dashboard search to add a movie or TV show from TMDb."
            actionLabel="Go to dashboard"
          />
        )}
      </main>
    </div>
  );
}
