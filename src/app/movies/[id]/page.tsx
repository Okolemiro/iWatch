import { AppHeader } from "@/components/app-header";
import { ConfirmRemoveDialog } from "@/components/confirm-remove-dialog";
import { PosterTile } from "@/components/poster-tile";
import { MovieTrackingPanel } from "@/features/media/movie-tracking-panel";
import { requireUser } from "@/lib/auth";
import { getMovieDetailsPageData } from "@/lib/data/media";
import { formatDate, formatRuntime } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/tmdb/images";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const movie = await getMovieDetailsPageData(id);
  const backdrop = getTmdbImageUrl(movie.backdropPath, "w780");

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-16 pt-8">
        <section
          className="hero-panel overflow-hidden rounded-[2.25rem]"
          style={
            backdrop
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(8,13,26,0.18), rgba(8,13,26,0.8)), url(${backdrop})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="grid gap-8 p-6 lg:grid-cols-[260px_1fr] lg:p-8">
            <PosterTile path={movie.posterPath} alt={movie.title} className="aspect-[2/3] w-full max-w-[260px]" />
            <div className="self-end">
              <p className="eyebrow text-white/80">Movie</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{movie.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{movie.overview}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">Release: {formatDate(movie.releaseDate)}</span>
                <span className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">Runtime: {formatRuntime(movie.runtime)}</span>
                {movie.genres.map((genre) => (
                  <span key={genre} className="rounded-full bg-black/18 px-3 py-1 backdrop-blur">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <MovieTrackingPanel libraryItemId={movie.id} watched={movie.watched} rating={movie.rating} />
          <ConfirmRemoveDialog libraryItemId={movie.id} title={movie.title} />
        </div>
      </main>
    </div>
  );
}
