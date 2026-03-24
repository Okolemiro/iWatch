export const APP_NAME = "iWatched";

export const APP_DESCRIPTION = "Track movies, TV shows, seasons, and episodes in your private library.";

export const LIBRARY_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
] as const;

export const LIBRARY_TYPE_OPTIONS = [
  { value: "all", label: "All titles" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV shows" },
] as const;

export const LIBRARY_SORT_OPTIONS = [
  { value: "recently-updated", label: "Recently updated" },
  { value: "recently-added", label: "Recently added" },
  { value: "title", label: "Title" },
  { value: "progress", label: "Progress" },
] as const;
