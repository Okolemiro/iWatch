import Link from "next/link";
import { Film, Home, LibraryBig, ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getSessionUser, getUserDisplayName } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export async function AppHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-page)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-13 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] text-white shadow-[0_20px_45px_rgba(255,120,68,0.26)]">
            <Film className="size-5" />
          </div>
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              {APP_NAME}
            </Link>
            <p className="text-sm text-[var(--color-text-muted)]">
              Private movie and TV tracker
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]"
          >
            <Home className="size-4" />
            Dashboard
          </Link>
          <Link
            href="/library"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-surface-strong)]"
          >
            <LibraryBig className="size-4" />
            Library
          </Link>

          {user ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm">
              <ShieldCheck className="size-4 text-[var(--color-accent)]" />
              <span className="font-medium">{getUserDisplayName(user)}</span>
            </div>
          ) : null}

          <ThemeToggle />
          {user ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  );
}
