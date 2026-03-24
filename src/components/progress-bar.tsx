import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">{label}</span>
          <span className="font-medium">{value}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-accent-soft)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
