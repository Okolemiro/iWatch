# iWatched

iWatched is a private movie and TV tracker built with Next.js and Supabase. It searches TMDb on the server, stores each user's library and progress in Supabase Postgres, and uses Row Level Security so users only see their own data.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres + RLS
- TMDb REST API
- Zod
- next-themes

## Required environment variables

Copy `.env.example` to `.env` and provide:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
TMDB_API_KEY="your_tmdb_api_key_here"
```

`TMDB_API_KEY` stays server-side. Do not expose a service-role key in the frontend.

## Security defaults

- Auth submissions are handled through server-side routes with safe redirect validation.
- Passwords are handled by Supabase Auth and are not stored in app code or app tables.
- The frontend only uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- App-level rate limiting protects sign-in and sign-up routes.
- Additional operational hardening steps are documented in [SECURITY.md](./SECURITY.md).

## Supabase setup

1. Create a new Supabase project.
2. Run the SQL in [supabase/migrations/0001_initial.sql](./supabase/migrations/0001_initial.sql).
3. In Supabase Auth, enable Email auth.
4. Add redirect URLs for:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
5. Add the app environment variables locally and in Vercel.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment notes

- The app is designed for Vercel deployment.
- All app data is stored in Supabase, not in a local database.
- Middleware protects app routes, and API handlers require authenticated sessions.
- Per-user isolation is enforced both in application flow and in database RLS policies.
