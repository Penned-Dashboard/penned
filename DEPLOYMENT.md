# Deployment Guide

## Recommended setup

- Hosting: Vercel
- Database: Supabase
- Auth: Clerk
- Payments: Stripe
- Email: Resend

## Environments

### Local

- Use `.env.local`
- Run `npm run dev`

### Preview

- Connect the GitHub repo to Vercel
- Every feature branch gets a preview deployment URL
- Use a staging Supabase project and Stripe test mode
- Add the env vars to the `Preview` environment in Vercel, not only `Production`

### Production

- Use `main` as the production branch
- Attach the primary custom domain in Vercel
- Point production env vars to production Supabase, Clerk, Stripe, and Resend

## Required environment variables

Copy [.env.example](/Users/dinaldholiya/All Projects/penned/.env.example) into the relevant environment and set:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`

For the current password-based workspace auth, these are the minimum required vars for signup/signin to work on a preview deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS`

## Supabase setup

1. Create a Supabase project for staging.
2. Run [supabase/schema.sql](/Users/dinaldholiya/All Projects/penned/supabase/schema.sql).
3. Run [supabase/seed.sql](/Users/dinaldholiya/All Projects/penned/supabase/seed.sql).
4. Add the Supabase URL, anon key, and service role key to Vercel and local envs.

## Current runtime behavior

- If `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the client order form writes to Supabase and the dashboards read live order data.
- If those variables are missing, the app falls back to demo data so previews still render cleanly.
- If preview deployments are missing the Supabase server vars, signup/signin will fail. Make sure the Vercel env vars are enabled for `Preview`.

## Production domain suggestion

- `www.penned.io` as the primary app domain
- `penned.io` redirected to `www.penned.io`
- optional `staging.penned.io` for a stable pre-production environment

## Go-live checklist

1. Vercel project connected to GitHub
2. Staging and production env vars added
3. Supabase schema and seed applied
4. Clerk instance configured
5. Stripe test mode configured, then live mode configured
6. Custom domain connected and DNS verified
7. Production deployment validated with `npm run build`
