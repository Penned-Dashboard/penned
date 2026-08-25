# Client Feedback Status - August 10, 2026

Source: `Penned | Dinal Feedback & Updates | Client Dashboard v2` plus the three screenshare walkthroughs.

## Done in this pass
- Client folders: rename to `Client folders`, add search, collapse the list, show details in the right column, change the page CTA to `Create New Folder`, and add load more
- Content type cards: What you’ll get / Perfect for / Price, remove suggested turnaround and “starting price”, keep Coming soon lockouts
- SEO Content intake fields match the spec, including conditional link restrictions
- Priority labels: Standard, Priority (prioritise before my other orders), Rush +$0.02/pw (24hr, or 48hr for technical / thought leadership / interview)
- Rush fee is added to the estimated total and persisted order budget
- Service selector on the order form, service-specific fields reset on switch, blank optional fields still save
- File upload fields for Interview, Editing, Rewriting, plus a universal supporting-files input
- Split sidebar into `Content Budget` and `Billing`
- Content Budget shows remaining dollars, discount tier, total saved, burn rate, recent activity, account manager, and a top-up CTA that opens the pre-payment page
- New pre-payment page with tier cards, amount input, article estimate, summary, and confirmation CTA
- Billing page now holds invoices, payment method, billing contact, payment terms, and Priority Account
- Bulk orders: add rows, paste from Google Sheets, CSV upload, validation, price preview, payment source, and batch submit
- Settings: email overflow, invite a team member, roles, and approval rule toggles. Review Preferences stays removed
- Request Revision is the primary action on delivered items

## Still to do
- Persist wallet balances, invoices, team invites, and approval rules in Supabase instead of review snapshots
- Store uploaded files in object storage rather than filename metadata
- Excel `.xlsx` binary parsing (CSV / TSV / Sheets paste is live)
- Wire Stripe checkout amount to the typed top-up value
- Writer/admin surfaces for the new intake fields and batch IDs
