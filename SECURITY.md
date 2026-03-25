# Security Notes

This app uses Supabase Auth and Supabase Postgres with Row Level Security. The application code enforces safe redirect handling, server-side auth route handling, and basic auth rate limiting. Some security controls are managed by Supabase and Vercel rather than by application code.

## What the app enforces

- Passwords are never stored in app code or the app database.
- Auth submissions go through app-controlled server routes.
- Post-auth redirects are restricted to internal paths.
- Session checks happen in middleware, server helpers, and API handlers.
- Public client code only receives the Supabase anon key, never a service-role key.
- Metadata tables are readable by owners and insertable during library creation, but no longer client-updatable.
- Sign-in and sign-up attempts are rate limited in the app layer.

## Required Supabase settings

- Keep Email auth enabled with email confirmation required.
- Use strong password requirements in Supabase Auth settings.
- Enable leaked password protection if your plan supports it.
- Keep Supabase Auth rate limits enabled.
- Keep password reset and OTP expiry on Supabase-managed defaults or stricter values.
- Configure exact redirect URLs for local development and production only.
- Set session time-box or inactivity timeout if your plan supports session lifetime controls.

## Required Vercel settings

- Store secrets only in Vercel environment variables.
- Never add a Supabase service-role key to client-exposed env vars.
- Limit Production environment variable editing to trusted maintainers.
- Enable team 2FA enforcement if multiple people have access.
- Protect preview deployments if they should not be public.

## Notes on password storage and session expiry

Supabase Auth stores hashed passwords using bcrypt rather than exposing raw passwords to application code. Session lifetime, inactivity timeout, password reset token expiry, and several auth-side rate limits are controlled by Supabase project settings instead of the Next.js app itself.
