export type ProgressState = "not-started" | "in-progress" | "completed";

export function getProgressPercentage(watched: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((watched / total) * 100);
}

export function getProgressState(watched: number, total: number): ProgressState {
  if (watched <= 0) {
    return "not-started";
  }

  if (watched >= total && total > 0) {
    return "completed";
  }

  return "in-progress";
}
