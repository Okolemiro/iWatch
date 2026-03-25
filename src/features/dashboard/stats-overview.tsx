import type { ReactNode } from "react";
import { BarChart3, Clapperboard, Tv } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";

type StatsOverviewProps = {
  stats: {
    trackedMovies: number;
    trackedShows: number;
    watchedEpisodes: number;
    totalEpisodes: number;
    progressPercentage: number;
  };
};

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className="hero-panel rounded-[2.2rem] p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--color-accent)_20%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Overall progress</p>
            <p className="text-3xl font-semibold tracking-[-0.04em]">{stats.progressPercentage}%</p>
          </div>
        </div>
        <ProgressBar
          value={stats.progressPercentage}
          label={`${stats.watchedEpisodes} of ${stats.totalEpisodes} episodes watched`}
          className="mt-6"
        />
      </div>

      <StatCard label="Tracked shows" value={stats.trackedShows} icon={<Tv className="size-5" />} />
      <StatCard label="Tracked movies" value={stats.trackedMovies} icon={<Clapperboard className="size-5" />} />
      <StatCard label="Watched episodes" value={stats.watchedEpisodes} icon={<BarChart3 className="size-5" />} />
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="panel rounded-[2rem] p-6">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-strong)_88%,transparent)] text-[var(--color-accent)]">
        {icon}
      </div>
      <p className="mt-5 text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}
