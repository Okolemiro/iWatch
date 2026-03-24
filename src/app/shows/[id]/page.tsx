import { AppHeader } from "@/components/app-header";
import { ConfirmRemoveDialog } from "@/components/confirm-remove-dialog";
import { PosterTile } from "@/components/poster-tile";
import { ProgressBar } from "@/components/progress-bar";
import { ShowDetailClient } from "@/features/media/show-detail-client";
import { requireUser } from "@/lib/auth";
import { getShowDetailsPageData } from "@/lib/data/media";
import { getTmdbImageUrl } from "@/lib/tmdb/images";
import { formatDate } from "@/lib/utils";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const show = await getShowDetailsPageData(id);
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
                  backgroundImage: `linear-gradient(180deg, rgba(8,13,26,0.18), rgba(8,13,26,0.82)), url(${backdrop})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="grid gap-8 p-6 lg:grid-cols-[260px_1fr] lg:p-8">
            <PosterTile path={show.posterPath} alt={show.title} className="aspect-[2/3] w-full max-w-[260px]" />
            <div className="self-end">
              <p className="eyebrow text-white/80">TV show</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{show.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{show.overview}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">First aired: {formatDate(show.firstAirDate)}</span>
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">{show.totalSeasons} seasons</span>
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">
                  {show.watchedEpisodes}/{show.totalEpisodes} episodes watched
                </span>
                {show.genres.map((genre) => (
                  <span key={genre} className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">
                    {genre}
                  </span>
                ))}
              </div>
              <ProgressBar value={show.progressPercentage} className="mt-6 max-w-xl" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <ConfirmRemoveDialog libraryItemId={show.id} title={show.title} />
        </div>

        <ShowDetailClient libraryItemId={show.id} rating={show.rating} seasons={show.seasons} />
      </main>
    </div>
  );
}
