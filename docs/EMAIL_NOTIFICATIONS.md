# Email notifications

The dashboard sends its own emails through [Resend](https://resend.com). There is no Zapier step.

## Files

| File | What it does |
| --- | --- |
| `src/lib/email.ts` | Sends through Resend's batch API with `fetch`. Never throws. |
| `src/lib/email-templates.ts` | Copy and HTML/text layout for every email. |
| `src/lib/notifications.ts` | One `notify…` function per event: who is told, and the bulk-order rules. |
| `src/lib/email-prefs.ts` | Client email settings, stored in `profiles.notification_prefs.client_email`. |
| `src/app/api/cron/daily-summary/route.ts` | Daily summary job, scheduled in `vercel.json` (08:00 UTC). |

Each action calls `queueNotification(() => notify…())` after its database write. That runs after the response (`after()` from `next/server`), so email can't slow down or break the action.

## Environment variables

| Name | Needed | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Without it nothing is sent. |
| `EMAIL_FROM` | yes | For example `Penned <notifications@mail.penned.io>`. The domain must be verified in Resend. |
| `EMAIL_REPLY_TO` | no | Where replies go. |
| `EMAIL_ALLOWLIST` | no | Comma-separated addresses. Until `EMAIL_MODE=live`, only these receive email. |
| `EMAIL_MODE` | no | Set to `live` to send to everyone. |
| `CRON_SECRET` | for the summary | Vercel Cron sends it as a bearer token. Without it the cron route returns 401. |

With a key but no allow-list and no `EMAIL_MODE=live`, nothing is sent. That is deliberate.

## What is sent

| Event | Where it is called | Emails |
| --- | --- | --- |
| Client signs up | `signUpAction` | Welcome to the client; "New client" to admins and account managers |
| Admin changes a role | `updateAdminProfile` | Welcome to a new writer or editor |
| Order placed | `createOrder`, `createBulkOrders` | Receipt to the client (one per batch); "New order" to account managers (admins if there are none) |
| Writer claims | `claimOrder` | Confirmation to the writer |
| Writer submits | `submitDraft` | Editors if the order is `with_editor`; otherwise "draft ready" to the client |
| Editor approves | `approveDraftAction` | "Draft ready" to the client |
| Editor sends back | `sendBackToWriterAction` | To the writer |
| Client asks for changes | `requestRevision` | To the writer (with the note) and account managers |
| Client approves | `acceptSubmission` | To the writer and the client |
| Comment on a draft | `addSubmissionComment` | To the writer, unless they wrote it |
| Order cancelled | `refundOrderToClientBudget` | To the client (always) |
| Top-up paid | Stripe webhook | To the client (always) and admins |
| Payout requested / approved | `requestPayout`, `approvePayout` | To admins / to the writer |

Not sent yet: "We have a question about your brief" (the question text isn't stored), password reset, deadline reminders, "new order available" to writers.

## Client settings and bulk orders

Clients can turn order updates off, or choose one daily summary, in Settings. A missing value means on. Payment, cancellation and welcome emails ignore the setting. Writers' existing email preferences are respected for the three events they cover (`revision_requested`, `submission_approved`, `payout_update`).

Orders that share `intake_details._batchId` are a bulk order and never send one email per piece:

1. One receipt for the batch.
2. "The first of your N drafts is ready", straight away.
3. One daily summary while more drafts arrive (skipped if nothing is new).
4. "All N drafts are ready", straight away.
5. "Your bulk order is complete" when every piece is approved or cancelled.

## Things to know

- Notes and comments quoted to writers go through `redactContactDetails`, the same as the order page.
- "Draft ready" counts any submitted draft. Once drafts go to the editor queue first (`with_editor`), `getClientDraftStates` should count only drafts the client can see.
- Vercel Cron runs on production deployments only.
