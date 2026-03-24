"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { publicEnv } from "@/lib/public-env";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitLabel = useMemo(
    () => (mode === "sign-in" ? "Sign in to your library" : "Create your account"),
    [mode],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      setMessage(null);
      setError(null);

      try {
        if (mode === "sign-in") {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw signInError;
          }

          router.push(next);
          router.refresh();
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
            data: {
              display_name: displayName.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage("Account created. Check your email to confirm your address, then sign in.");
        setMode("sign-in");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
      }
    });
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-black/28 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-in" ? "bg-white text-slate-950" : "text-white/72 hover:text-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === "sign-up" ? "bg-white text-slate-950" : "text-white/72 hover:text-white"
          }`}
        >
          Create account
        </button>
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{submitLabel}</h1>
        <p className="mt-3 text-sm leading-6 text-white/72">
          {APP_NAME} keeps every library private. Your movies, shows, ratings, and progress only belong to your
          account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "sign-up" ? (
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-white/80">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="How should we label your library?"
              className="focus-ring rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-white/40"
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-white/80">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="focus-ring rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-white/40"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-white/80">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="focus-ring rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-white/40"
          />
        </label>

        {message ? <p className="rounded-2xl bg-emerald-500/12 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
