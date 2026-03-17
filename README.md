# Penned

Penned is a dashboard-first publishing operations app for three audiences:

- Clients who order and review content.
- Writers who claim jobs, submit drafts, and track payouts.
- Admins who oversee fulfillment, payouts, rankings, and content types.

## Stack

- Next.js App Router
- Tailwind CSS v4
- Supabase schema scaffold in `supabase/schema.sql`
- Clerk, Stripe, and Resend environment placeholders in `.env.example`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in demo mode by default. Use the role switch links on the landing page to move between dashboards.

## Current scope

This repo is intentionally scoped to an MVP foundation:

- Marketing page and role-aware dashboard routing
- Client dashboard with order form contract, review queue, and billing snapshot
- Writer dashboard with marketplace, submissions, wallet, and rankings
- Admin dashboard with operations, catalog, payouts, and ranking controls
- Initial Supabase schema for profiles, orders, submissions, wallets, subscriptions, rankings, disputes, and notifications

## Recommended next build steps

1. Connect Clerk and replace the demo role cookie with authenticated user roles.
2. Add Supabase clients, row-level security, and server actions for real order creation.
3. Add Stripe Billing and Connect webhooks for subscriptions and payouts.
4. Replace seeded mock data with queries and analytics snapshots.
