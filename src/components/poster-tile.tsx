import Image from "next/image";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTmdbImageUrl } from "@/lib/tmdb/images";

type PosterTileProps = {
  path?: string | null;
  alt: string;
  className?: string;
  size?: "small" | "large";
};

export function PosterTile({
  path,
  alt,
  className,
  size = "large",
}: PosterTileProps) {
  const src = getTmdbImageUrl(path, size === "large" ? "w500" : "w342");

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]",
          className,
        )}
      >
        <Film className="size-10" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[1.5rem]", className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
    </div>
  );
}
