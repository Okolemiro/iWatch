"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/sign-out", {
          method: "POST",
        });
        router.push("/auth");
        router.refresh();
      }}
      className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-strong)]"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
