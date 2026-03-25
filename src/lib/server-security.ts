import "server-only";
import { createHash } from "node:crypto";

export function hashRateLimitIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
