import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { StatsOverview } from "@/features/dashboard/stats-overview";
import { MediaCard } from "@/features/library/media-card";
import { SearchPanel } from "@/features/search/search-panel";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function HomePage() {
  await requireUser("/");
  const { stats, recentItems } = await getDashboardData();

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section className="hero-panel overflow-hidden rounded-[2.25rem] px-6 py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">
                iWatched dashboard
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-6xl">
                Your private watchlist, ratings, and episode progress in one secure place.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
                Search TMDb, add titles in seconds, and keep every movie and show tied to your own account with
                Supabase-backed access control.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/library"
                className="focus-ring inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Open library
              </Link>
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-text-muted)]">
                Everything you track is isolated to your own account.
              </div>
            </div>
          </div>
        </section>

        <StatsOverview stats={stats} />
        <SearchPanel />

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
