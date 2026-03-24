import "server-only";
import { z } from "zod";
import { publicEnv } from "@/lib/public-env";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  TMDB_API_KEY: z.string().min(1),
});

export const env = serverSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: publicEnv.NEXT_PUBLIC_SITE_URL,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
});

export function assertTmdbApiKey() {
  return env.TMDB_API_KEY;
}
