import { ProgressState } from "@/lib/progress";
import { cn } from "@/lib/utils";

const statusMap: Record<ProgressState, { label: string; className: string }> = {
  "not-started": {
    label: "Not started",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  "in-progress": {
    label: "In progress",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

export function StatusBadge({ status }: { status: ProgressState }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        statusMap[status].className,
      )}
    >
      {statusMap[status].label}
    </span>
  );
}
