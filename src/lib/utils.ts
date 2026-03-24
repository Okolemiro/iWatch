import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatYear(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 4);
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes || minutes <= 0) {
    return "Unknown";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  if (!remainder) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function pluralize(word: string, count: number) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}
