# Client Feedback Status - July 17, 2026

## Done in this pass
- Rename client workspace toward `Content Ops Engine`
- Add `Client` field to order intake
- Add `Client Folder` linkage to order intake
- Add `Tier` and `Language` fields to order intake
- Add service-specific order fields that change with the selected content type
- Add dynamic order pricing summary tied to service and tier
- Add `Client` column to client order listings
- Add real `View all` orders page
- Add `Completed Orders` page entry
- Add persistent `Client Folders` model, page, and create-folder flow
- Upgrade `Bulk Orders` page to reflect the planned batch workflow
- Replace `Plan` framing on homepage with `Content Budget` / billing framing
- Remove the old large homepage CTA block / current plan block
- Update review queue to show client context instead of only writer context
- Add auto-refresh behavior to the client workspace
- Replace client billing page with `Content Budget` / `Priority Account` language
- Rework client settings around billing contact, team invites, and approval rules
- Update Supabase schema and seed data for folders, richer orders, and the new content catalog
- Add exact content type catalog ordering plus `Coming soon` lockout states

## Still to do
- Run the updated Supabase SQL so the new schema and catalog exist in the live project
- Make the Vercel preview public or disable preview protection if external testing is needed
- Full bulk-order import flow (Google Sheets paste / CSV / Excel parsing and validation)
- True budget / wallet / credit-line logic backed by live Stripe and account status
- Editable folder updates and order detail views for every new metadata field
- Writer/admin updates if new feedback expands beyond the client dashboard
