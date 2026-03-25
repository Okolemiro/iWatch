import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hashRateLimitIdentifier } from "@/lib/server-security";
import { buildAuthCallbackUrl, getClientIpAddress } from "@/lib/security";

const signUpSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/\d/, "Include at least one number."),
  next: z.string().optional(),
});

const SIGN_UP_LIMIT = 3;
const SIGN_UP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid sign-up request." },
      { status: 400 },
    );
  }

  const ipAddress = getClientIpAddress(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  const rateLimitKey = `sign-up:${hashRateLimitIdentifier(`${ipAddress}:${parsed.data.email}`)}`;
  const rateLimit = consumeRateLimit({
    key: rateLimitKey,
    limit: SIGN_UP_LIMIT,
    windowMs: SIGN_UP_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(env.NEXT_PUBLIC_SITE_URL, parsed.data.next),
    },
  });

  if (error) {
    return NextResponse.json({ error: "Could not create your account." }, { status: 400 });
  }

  return NextResponse.json({
    message: "Account created. Check your email to confirm your address, then sign in.",
  });
}
