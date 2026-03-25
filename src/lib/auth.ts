import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { sanitizeNextPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath = "/") {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`);
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }
}

export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      supabase: null,
      user: null,
    };
  }

  return {
    response: null,
    supabase,
    user,
  };
}

export function getUserDisplayName(user: User) {
  return user.user_metadata?.display_name || user.email || "Viewer";
}
