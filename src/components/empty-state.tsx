import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref = "/",
}: EmptyStateProps) {
  return (
    <div className="panel rounded-[2.2rem] p-10 text-center">
      <h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
      {actionLabel ? (
        <Link
          href={actionHref}
          className="focus-ring mt-6 inline-flex rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
