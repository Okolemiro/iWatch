import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/library", "/movies", "/shows"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (pathname === "/auth" && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requiresAuth = pathname === "/" || protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && requiresAuth) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
