# Penned

Penned is a dashboard-first publishing operations app for three audiences:

- Clients who order and review content.
- Writers who claim jobs, submit drafts, and track payouts.
- Admins who oversee fulfillment, payouts, rankings, and content types.

## Stack

- Next.js App Router
- Tailwind CSS v4
- Supabase schema scaffold in `supabase/schema.sql`
- Stripe environment placeholders in `.env.example`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current scope

This repo is intentionally scoped to an MVP foundation:

- Marketing page and branded auth flow
- Session-backed role-aware dashboard routing for clients, writers, and admins
- Client dashboard with live order intake, review queue, order detail, and billing workspace
- Writer dashboard with marketplace, claim flow, submission flow, payouts, and rankings
- Admin dashboard with operations, catalog, payouts, and order oversight
- Supabase schema for profiles, orders, submissions, wallets, subscriptions, rankings, disputes, notifications, and payout requests
- Stripe checkout and webhook routes for subscription setup
- Shared UI system aligned to the Penned marketing surface

## Project status

For the current implementation audit, deployment recommendation, and short-term delivery timeline, see [docs/project-status-2026-04-03.md](/Users/dinaldholiya/All Projects/penned/docs/project-status-2026-04-03.md).

For environment setup and deployment steps, see [DEPLOYMENT.md](/Users/dinaldholiya/All Projects/penned/DEPLOYMENT.md).

## Launch SQL (before real money)

Run these in the Supabase SQL editor if not already applied:

1. `supabase/client-terms-and-vat.sql`
2. `supabase/team-roles-and-workflow.sql`
3. `supabase/security-launch-hardening.sql` — webhook idempotency, writer approval + terms columns, client wallets / ledger

## Recommended next build steps

1. Run the latest Supabase upgrade SQL and seed data against the active project.
2. Add Supabase row-level security and replace service-role reads/writes with session-aware access.
3. Add Stripe product price IDs and the webhook signing secret.
4. Connect Stripe payout rails or Stripe Connect for real writer disbursements.
5. Add deeper analytics and notification delivery once the core workflow is stable.
