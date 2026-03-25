import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hashRateLimitIdentifier } from "@/lib/server-security";
import { getClientIpAddress, sanitizeNextPath } from "@/lib/security";

const signInSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
  next: z.string().optional(),
});

const SIGN_IN_LIMIT = 5;
const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });
  }

  const ipAddress = getClientIpAddress(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  const rateLimitKey = `sign-in:${hashRateLimitIdentifier(`${ipAddress}:${parsed.data.email}`)}`;
  const rateLimit = consumeRateLimit({
    key: rateLimitKey,
    limit: SIGN_IN_LIMIT,
    windowMs: SIGN_IN_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  return NextResponse.json({
    redirectTo: sanitizeNextPath(parsed.data.next),
  });
}
