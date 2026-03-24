import { AppHeader } from "@/components/app-header";
import { PosterTile } from "@/components/poster-tile";
import { ProgressBar } from "@/components/progress-bar";
import { WatchlistDetailActions } from "@/components/watchlist-detail-actions";
import { requireUser } from "@/lib/auth";
import { getWatchlistShowDetailsPageData } from "@/lib/data/watchlist";
import { getTmdbImageUrl } from "@/lib/tmdb/images";
import { formatDate } from "@/lib/utils";

export default async function WatchlistShowPage({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  await requireUser();
  const { tmdbId } = await params;
  const show = await getWatchlistShowDetailsPageData(Number(tmdbId));
  const backdrop = getTmdbImageUrl(show.backdropPath, "w780");

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section
          className="hero-panel overflow-hidden rounded-[2.25rem]"
          style={
            backdrop
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(8,8,10,0.22), rgba(8,8,10,0.82)), url(${backdrop})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="grid gap-8 p-6 lg:grid-cols-[260px_1fr] lg:p-8">
            <PosterTile path={show.posterPath} alt={show.title} className="aspect-[2/3] w-full max-w-[260px]" />
            <div className="self-end">
              <p className="eyebrow text-white/80">Watchlist show</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{show.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{show.overview}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">First aired: {formatDate(show.firstAirDate)}</span>
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">{show.totalSeasons} seasons</span>
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">{show.totalEpisodes} episodes</span>
                {show.genres.map((genre) => (
                  <span key={genre} className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <WatchlistDetailActions
          tmdbId={show.tmdbId}
          mediaType="tv"
          watchlistItemId={show.id}
        />

        <section className="panel rounded-[2rem] p-5 lg:p-6">
          <div>
            <p className="eyebrow">Season overview</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">What&apos;s in this show</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {show.seasons.map((season) => (
              <article key={season.seasonNumber} className="panel-muted rounded-[1.5rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {season.name.trim().toLowerCase() === `season ${season.seasonNumber}`.toLowerCase()
                      ? `Season ${season.seasonNumber}`
                      : `Season ${season.seasonNumber}: ${season.name}`}
                  </h3>
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {season.episodeCount} eps
                  </span>
                </div>
                <ProgressBar value={season.progressPercentage} className="mt-4" />
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
