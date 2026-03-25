const SAFE_FALLBACK_PATH = "/";

export function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return SAFE_FALLBACK_PATH;
  }

  const normalizedPath = nextPath.trim();

  if (!normalizedPath.startsWith("/")) {
    return SAFE_FALLBACK_PATH;
  }

  if (normalizedPath.startsWith("//") || normalizedPath.includes("\\") || normalizedPath.includes("\u0000")) {
    return SAFE_FALLBACK_PATH;
  }

  return normalizedPath;
}

export function buildAuthCallbackUrl(siteUrl: string, nextPath: string | null | undefined) {
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", sanitizeNextPath(nextPath));
  return callbackUrl.toString();
}

export function getClientIpAddress(forwardedForHeader: string | null, fallbackIpHeader: string | null) {
  if (forwardedForHeader) {
    return forwardedForHeader.split(",")[0]?.trim() || "unknown";
  }

  return fallbackIpHeader?.trim() || "unknown";
}
