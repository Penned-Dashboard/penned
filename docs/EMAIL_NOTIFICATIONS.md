# Email notifications

The dashboard sends its own emails through [Resend](https://resend.com). There is no Zapier step. Copy and timings were approved by Penned on 16 Nov 2026.

## Files

| File | What it does |
| --- | --- |
| `src/lib/email.ts` | Sends through Resend's batch API with `fetch`. Never throws. |
| `src/lib/email-templates.ts` | Copy and HTML/text layout for every email (logo header, lime button). |
| `src/lib/notifications.ts` | Instant emails: one `notify…` function per event, recipients, bulk-order grouping. |
| `src/lib/notification-scheduler.ts` | Timed emails: deadline reminders, team alerts, 08:00 UK summaries. |
| `src/lib/email-prefs.ts` | Client email settings, stored in `profiles.notification_prefs.client_email`. |
| `src/lib/order-workflow.ts` | Deadline rules (`timingChangesForStatus`, `revisionFixBy`). |
| `src/app/api/cron/tick/route.ts` | Runs the timed emails. Needs `Authorization: Bearer $CRON_SECRET`. |
| `src/lib/email-samples.ts`, `src/app/api/email-samples/route.ts` | Preview-only: sends one sample of every email for review. 404 on Production. |
| `supabase/notification-log.sql` | `notification_log` table that stops timed emails repeating. |

Actions call `queueNotification(() => notify…())` after their database write. That runs after the response (`after()` from `next/server`), so email can't slow down or break the action.

## Environment variables

| Name | Needed | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Without it nothing is sent. |
| `EMAIL_FROM` | yes | `Penned <notifications@mail.penned.io>`. `mail.penned.io` is verified in Resend. |
| `EMAIL_REPLY_TO` | no | Where replies go. |
| `EMAIL_ALLOWLIST` | until live | Comma-separated. Until `EMAIL_MODE=live`, only these addresses receive email. |
| `EMAIL_MODE` | to go live | `live` sends to everyone. |
| `ADMIN_NOTIFICATION_EMAILS` | no | Where admin emails go (support@penned.io). Without it, every admin account. |
| `CRON_SECRET` | for timed emails | Sent by the scheduler as a bearer token. Without it the tick route returns 401. |
| `EMAIL_SAMPLES_TOKEN` | no | Preview only, for the sample route. Delete after use. |

## Deadlines

Accepting a brief (`waiting_for_writer`) sets `client_due_at` (72 hours, 48 for rush) and `writer_due_at` (6 hours earlier, for editing). Waiting on the client after acceptance pauses the clock (`pause_started_at`, `total_paused_minutes`) and both deadlines move back when it resumes. A client change request sets `writer_due_at` to 24 hours later (12 for rush); an editor send-back aims for 2 hours before the client deadline. Orders accepted before this existed have no deadline and get no reminders.

Actions now keep `workflow_status` in step: claim → `being_written`, submit → `in_review` (drafts go straight to the client until the editor step is connected), change request → `changes_requested`, approval → `completed`.

## In-app notifications (the bell)

`src/components/notification-bell.tsx` sits in the top bar of `DashboardShell` for every role. It fetches `/api/notifications` on load, once a minute while the tab is visible, and when the tab comes back into view. `/notifications` lists the latest 100 with an Unread tab. Opening an item goes through `/api/notifications/open?id=…`, which marks it read and redirects to its page. Storage and helpers: `src/lib/in-app-notifications.ts`; table `public.notifications` (`supabase/in-app-notifications.sql` adds `href`, `kind` and an index).

Rule: the bell shows things that need the person's attention, never a confirmation of something they just did. It is independent of email settings; writers' per-event "In-app" settings are respected.

| Who | Bell notifications |
| --- | --- |
| Client | Brief accepted (with due time), draft ready, revised draft ready, order cancelled |
| Writer | Assigned, editor sent back, client asked for changes, approved, payout approved, new comment, due in 2 hours, overdue, order cancelled |
| Editor | Assigned, draft ready to edit, resubmitted |
| Account managers | New order to check, changes requested, and the timed alerts (brief unchecked, no writer, writer missed deadline, at risk, client deadline missed) |
| Admin | New client, new order, changes requested, payout requested, client deadline missed (and the account manager alerts while there are no account managers) |

Items clear themselves when the person deals with them: a client's "draft ready" when they approve or ask for changes; a writer's order notifications when they submit.

## Assigning writers and editors

Account managers (Orders page) and admins (order page) can assign or change the writer and editor (`src/app/assign-actions.ts`, `assignOrderWriter` / `assignOrderEditor` in `src/lib/team-data.ts`). A writer can only be assigned once the brief is accepted (so the deadline is running), must have the writer role and not be pending or paused. Assigning to an unclaimed order moves it to `being_written`; reassigning keeps the deadline. The editor is stored in `orders.editor_id`, and editor emails and queue reminders then go only to that editor. The client's "Preferred writer" from the order form is saved in `intake_details.preferred_writer` and shown next to the controls.

## Instant emails

| Event | Where it is called | Emails |
| --- | --- | --- |
| Client signs up | `signUpAction` | Welcome to the client; "New client" to admin |
| Admin changes a role | `updateAdminProfile` | Welcome to a new writer or editor |
| Order placed | `createOrder`, `createBulkOrders` | Receipt to the client (one per batch); "New order" to account managers and admin |
| Brief accepted | `acceptBriefAction` | "Brief accepted, due …" to the client (one per bulk batch) |
| Writer claims | `claimOrder` | Confirmation with deadline to the writer |
| Writer assigned | `assignWriterAction` (account manager orders page, admin order page) | "You've been assigned: …" with deadline to the writer |
| Editor assigned | `assignEditorAction` (same pages) | "You're editing: …" to the editor |
| Writer submits | `submitDraft` | The assigned editor (all editors if none) if the order is `with_editor`; otherwise "draft ready" to the client |
| Editor approves / sends back | `approveDraftAction`, `sendBackToWriterAction` | Client draft ready / writer with fix-by time |
| Client asks for changes | `requestRevision` | Writer (note and fix-by time); account managers from the second round |
| Client approves | `acceptSubmission` | Writer; client only when a whole bulk batch is done |
| Comment on a draft | `addSubmissionComment` | Writer, unless they wrote it |
| Order cancelled | `refundOrderToClientBudget` | Client (always) |
| Top-up paid | Stripe webhook | Client (always) |
| Payout approved | `approvePayout` | Writer |

"Account managers" falls back to the admin recipients while nobody has the `account_manager` role. Client notes and comments quoted to writers go through `redactContactDetails`.

## Timed emails (`runNotificationTick`)

| Who | When |
| --- | --- |
| Writer | 12 hours before `writer_due_at` (8 for rush; follows their "deadline reminders" setting), 2 hours before, and when overdue |
| Account managers | Brief unchecked 4 hours after the order (1 for rush); no writer 6 hours after acceptance (2 for rush); writer missed their deadline; at risk 12 hours before `client_due_at` (6 for rush) with nothing delivered and no draft with an editor; client deadline missed |
| Admin | Client deadline missed |
| Editors | Draft in the queue 2 hours; account managers told at 4 hours |
| Everyone | From 08:00 UK, once a day: account manager summary, admin summary (new clients, top-ups, payout requests, late orders), client daily summaries |
| Signature and Specialist writers | From 08:00 UK, once a day, only if new work arrived: Signature and Specialist jobs that reached the marketplace in the last 24 hours and are still unclaimed (status `open`, no writer). Signature writers get Signature jobs; Specialist writers (`writer_tier` "specialist" or the "specialist" niche tag) get both. Follows the writer's "new matching jobs" setting; skips pending or paused writers. |

Each timed email has a key in `notification_log` (for example `writer_final:<order>:<writer_due_at>`), so it is sent once; a new deadline gets fresh reminders.

**Scheduling:** Supabase `pg_cron` calls `https://app.penned.io/api/cron/tick` every 15 minutes with the bearer token. `vercel.json` also calls it daily at 08:00 UTC as a fallback (Vercel Hobby only allows daily jobs).

## Writer tiers

`profiles.writer_tier` is "standard", "signature" or "specialist", set by admin on the People page. Order tiers are `orders.service_tier`: "on-demand" (Standard), "signature", "rank" (Specialist). The marketplace hides Specialist jobs from non-specialists; Signature jobs are shown to every writer (labelled Standard there).

## Client settings and bulk orders

Clients can turn order updates off, or choose one daily summary, in Settings. A missing value means on. Payment, cancellation and welcome emails ignore the setting.

Orders that share `intake_details._batchId` are a bulk order and never send one email per piece: one receipt, one "brief accepted", "the first of your N drafts is ready", one daily summary while more arrive, "all N drafts are ready", and "your bulk order is complete".

## Things to know

- "Draft ready" counts any submitted draft. Once drafts go to the editor queue first (`with_editor`), `getClientDraftStates` should count only drafts the client can see.
- The "we have a question about your brief" email isn't built: the question text isn't stored yet.
- Vercel Cron and the tick only reach Production; preview builds sit behind Vercel's login.
