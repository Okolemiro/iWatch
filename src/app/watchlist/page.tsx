import { AppHeader } from "@/components/app-header";
import { WatchlistGrid } from "@/features/watchlist/watchlist-grid";
import { requireUser } from "@/lib/auth";
import { getWatchlistItems } from "@/lib/data/watchlist";

export default async function WatchlistPage() {
  await requireUser("/watchlist");
  const items = await getWatchlistItems();

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section className="space-y-3">
          <p className="eyebrow">Watchlist</p>
          <h1 className="text-4xl font-semibold tracking-tight">Everything you want to watch next</h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
            Save titles for later, then move them into your main collection once you start tracking them.
          </p>
        </section>

        <WatchlistGrid items={items} />
      </main>
    </div>
  );
}
