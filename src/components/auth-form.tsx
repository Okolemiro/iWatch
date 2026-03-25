"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitLabel = useMemo(
    () => (mode === "sign-in" ? "Sign in to your collection" : "Create your account"),
    [mode],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        if (mode === "sign-in") {
          const response = await fetch("/api/auth/sign-in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              next,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: string; redirectTo?: string }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error || "Authentication failed.");
          }

          router.push(payload?.redirectTo || "/");
          router.refresh();
          return;
        }

        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            next,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Authentication failed.");
        }

        setMessage(payload?.message || "Account created. Check your email to confirm your address, then sign in.");
        setMode("sign-in");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
      }
    });
  }

  return (
    <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="rounded-[1.7rem] border border-white/8 bg-[#0b0a10]/92 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.48)]">
              Account access
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">{submitLabel}</h1>
          </div>
          <div className="flex h-12 min-w-12 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(255,255,255,0.02))] text-sm font-semibold text-white">
            IW
          </div>
        </div>

        <p className="mt-4 max-w-md text-sm leading-6 text-white/64">
          {APP_NAME} keeps every collection private. Your movies, shows, ratings, and progress only belong to your
          account.
        </p>

        <div className="mt-8 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "sign-in"
                ? "bg-[linear-gradient(135deg,#ffffff,#d8ccff)] text-slate-950 shadow-[0_10px_24px_rgba(168,85,247,0.18)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "sign-up"
                ? "bg-[linear-gradient(135deg,#ffffff,#d8ccff)] text-slate-950 shadow-[0_10px_24px_rgba(168,85,247,0.18)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-white/78">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="focus-ring w-full rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/32 transition hover:border-white/16 focus:border-[rgba(192,132,252,0.5)]"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-white/78">Password</span>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 10 characters"
              className="focus-ring rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/32 transition hover:border-white/16 focus:border-[rgba(192,132,252,0.5)]"
            />
          </label>

          {mode === "sign-up" ? (
            <p className="rounded-[1.1rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-xs leading-5 text-white/58">
              Use at least 10 characters with uppercase, lowercase, and a number.
            </p>
          ) : null}

          {message ? (
            <p className="rounded-[1.2rem] border border-emerald-400/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[1.2rem] border border-rose-400/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffffff,#d8ccff_52%,#a855f7_180%)] px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/8 pt-5 text-xs text-white/44">
          <span>Secure auth powered by Supabase</span>
          <span>{mode === "sign-in" ? "Welcome back" : "Create access"}</span>
        </div>
      </div>
    </div>
  );
}
