import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { StatsOverview } from "@/features/dashboard/stats-overview";
import { MediaCard } from "@/features/library/media-card";
import { SearchPanel } from "@/features/search/search-panel";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getWatchlistItems } from "@/lib/data/watchlist";

export default async function HomePage() {
  await requireUser("/");
  const watchlistItems = await getWatchlistItems();
  const { stats, recentItems } = await getDashboardData();

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section className="hero-panel overflow-hidden rounded-[2.25rem] px-6 py-7 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">
                iWatched dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight lg:text-5xl">
                Your private watchlist, ratings, and episode progress in one secure place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] lg:text-base lg:leading-7">
                Search TMDb, add titles in seconds, and keep every movie and show tied to your own account with
                Supabase-backed access control.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/library"
                className="focus-ring inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Open library
              </Link>
              <Link
                href="/watchlist"
                className="focus-ring inline-flex items-center justify-center rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-center text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-strong)]"
              >
                Open watchlist
              </Link>
            </div>
          </div>
        </section>

        <StatsOverview stats={stats} />
        <SearchPanel />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Saved for later</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your watchlist</h2>
            </div>
            <Link href="/watchlist" className="text-sm font-semibold text-[var(--color-accent)]">
              View all
            </Link>
          </div>

          {watchlistItems.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {watchlistItems.slice(0, 4).map((item) => (
                <MediaCard
                  key={item.id}
                  item={{
                    id: item.id,
                    tmdbId: item.tmdbId,
                    title: item.title,
                    posterPath: item.posterPath,
                    backdropPath: item.backdropPath,
                    overview: item.overview,
                    mediaType: item.mediaType,
                    releaseDateOrFirstAirDate: item.releaseDateOrFirstAirDate,
                    genres: [],
                    addedAt: item.addedAt,
                    updatedAt: item.addedAt,
                    progressPercentage: 0,
                    status: "not-started",
                    watchedEpisodes: 0,
                    totalEpisodes: 0,
                    rating: null,
                    watched: false,
                    href: item.mediaType === "movie" ? `/watchlist/movies/${item.tmdbId}` : `/watchlist/shows/${item.tmdbId}`,
                    metaLabel: "Watchlist",
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No titles in your watchlist yet"
              description="Use the dashboard search to save shows or movies for later."
              actionLabel="Browse titles"
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Recently changed</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Latest activity</h2>
            </div>
            <Link href="/library" className="text-sm font-semibold text-[var(--color-accent)]">
              View all
            </Link>
          </div>

          {recentItems.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {recentItems.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your library is empty"
              description="Search for a movie or TV show above to start building your private tracker."
            />
          )}
        </section>
      </main>
    </div>
  );
}
