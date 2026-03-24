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
    <div className="panel rounded-[2rem] p-10 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
      {actionLabel ? (
        <Link
          href={actionHref}
          className="focus-ring mt-6 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
