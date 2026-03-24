type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="rounded-3xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}
