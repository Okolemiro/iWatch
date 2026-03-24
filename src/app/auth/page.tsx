import { redirectIfAuthenticated } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { AuthForm } from "@/components/auth-form";

export default async function AuthPage() {
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,201,117,0.22),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(97,193,255,0.18),_transparent_24%),linear-gradient(160deg,_#0f172a,_#111827_52%,_#1e293b)] px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="max-w-2xl">
          <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/76">
            Private tracking for movies and shows
          </div>
          <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-6xl">
            Welcome to {APP_NAME}.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
            Search TMDb, save titles to your collection, and keep ratings and watched progress synced to your
            own secure account.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <FeatureCard title="Private by default" description="Every row is scoped to your account with Supabase auth and RLS." />
            <FeatureCard title="Real progress" description="Movies, shows, seasons, and episodes stay synced across sessions." />
            <FeatureCard title="Deployment ready" description="Built for Vercel with server-side TMDb access and no local-db dependency." />
          </div>
        </section>

        <div className="lg:justify-self-end">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
    </div>
  );
}
