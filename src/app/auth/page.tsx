import { redirectIfAuthenticated } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { AuthForm } from "@/components/auth-form";

export default async function AuthPage() {
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.14),_transparent_26%),radial-gradient(circle_at_82%_14%,_rgba(255,255,255,0.06),_transparent_18%),linear-gradient(180deg,_#040406,_#09060f_42%,_#12091e)] px-6 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="relative max-w-2xl py-6 lg:py-12">
          <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(168,85,247,0.42),_transparent_72%)] blur-2xl" />
          <div className="relative inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
            Private tracking for movies and shows
          </div>
          <h1 className="relative mt-8 max-w-xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            A sharper home for everything you watch.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/68">
            {APP_NAME} keeps your library, watchlist, ratings, and episode progress in one account-first workspace with
            a cleaner, calmer flow than a spreadsheet or streaming queue.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <FeatureCard title="Private by default" description="Every row is scoped to your account with Supabase auth and RLS." />
            <FeatureCard title="Real progress" description="Movies, shows, seasons, and episodes stay synced across sessions." />
            <FeatureCard title="Fast to use" description="Search TMDb, save titles, and pick up where you left off with less clutter." />
          </div>

          <div className="mt-10 flex flex-wrap gap-8 text-sm text-white/62">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white">01</p>
              <p className="mt-2">One private account for your entire tracker</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white">TMDb</p>
              <p className="mt-2">Search-backed discovery without leaving the app</p>
            </div>
          </div>
        </section>

        <div className="relative lg:justify-self-end">
          <div className="absolute inset-x-6 top-10 -z-10 h-52 rounded-full bg-[radial-gradient(circle,_rgba(168,85,247,0.28),_transparent_72%)] blur-3xl" />
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl">
      <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/64">{description}</p>
    </div>
  );
}
