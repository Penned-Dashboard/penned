insert into public.profiles (id, external_auth_id, email, full_name, role, company_name)
values
  ('11111111-1111-1111-1111-111111111111', 'seed-client', 'client@penned.dev', 'Penned Client Seed', 'client', 'Penned Labs'),
  ('22222222-2222-2222-2222-222222222222', 'seed-writer', 'writer@penned.dev', 'Penned Writer Seed', 'writer', null),
  ('33333333-3333-3333-3333-333333333333', 'seed-admin', 'admin@pen.dev', 'Penned Admin Seed', 'admin', 'Penned')
on conflict (id) do nothing;

insert into public.content_types (id, name, description, base_price_cents, turnaround_days, active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SEO Content', 'Publication-placed, keyword-optimised content written to earn links and rank.', 5, 5, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Blog Post', 'Promise-led, audience-first posts that deliver real value and drive traffic.', 5, 5, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Article', 'Editorial-depth pieces — reported, analytical, or opinion-led — for any channel.', 5, 6, true),
  ('ddddaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Technical Article', 'Accurate, claim-safe technical content written by specialists who know the field.', 7, 7, true),
  ('eeeebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Expert Writing / Thought Leadership', 'Thesis-led, evidence-backed content that positions real expertise — not just opinion.', 7, 7, true),
  ('ffffcccc-cccc-cccc-cccc-cccccccccccc', 'Personal PR', 'Reputation-safe, evidence-backed content that builds credibility for individuals.', 5, 5, true),
  ('1111dddd-dddd-dddd-dddd-dddddddddddd', 'Press Release', 'Fact-locked, media-ready announcements written to get picked up and published.', 5, 4, true),
  ('2222eeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Interview', 'Quote-faithful, narrative-aware content built from real interviews and transcripts.', 5, 5, true),
  ('3333ffff-ffff-ffff-ffff-ffffffffffff', 'Editing', 'Diagnosis-first editing that sharpens structure, voice, and clarity — nothing lost.', 5, 4, true),
  ('4444aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rewriting', 'Controlled transformation — same intent, clearer structure, stronger execution.', 5, 4, true),
  ('5555bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AI Content Rescue', 'Human-rebuilt copy from your AI draft — coming soon.', 5, 5, false),
  ('6666cccc-cccc-cccc-cccc-cccccccccccc', 'AEO/AI Search Content', 'Answer-structured, citation-ready AI search content — coming soon.', 7, 7, false),
  ('7777dddd-dddd-dddd-dddd-dddddddddddd', 'LinkedIn Post', 'Scroll-stopping social content for founders and executives — coming soon.', 7, 3, false),
  ('8888eeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Email Sequence', 'Purposeful, conversion-focused email flows — coming soon.', 10000, 4, false),
  ('9999ffff-ffff-ffff-ffff-ffffffffffff', 'Case Study', 'Proof-led customer stories and sales assets — coming soon.', 10000, 6, false)
on conflict (name) do update
set
  description = excluded.description,
  base_price_cents = excluded.base_price_cents,
  turnaround_days = excluded.turnaround_days,
  active = excluded.active;

insert into public.client_folders (
  id,
  client_id,
  name,
  brief_template_url,
  brand_notes,
  tone_guide,
  preferred_content_types,
  default_word_count,
  target_audience,
  compliance_notes,
  delivery_preference,
  content_calendar_notes
)
values
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Acme Robotics',
    'https://docs.google.com/document/d/acme-robotics-template',
    'Category leader in warehouse automation. Keep examples operational, practical, and proof-led.',
    'Clear, credible, and systems-minded.',
    '{"SEO Content","Technical Article","Article"}',
    1400,
    'Operations leaders at mid-market logistics companies',
    'Avoid unverified ROI claims. No safety guarantees without sourcing.',
    'Google Doc plus CMS-ready metadata',
    'Monthly warehouse automation campaign with one technical asset and one ranking piece.'
  )
on conflict (id) do nothing;

insert into public.orders (
  id,
  client_id,
  writer_id,
  content_type_id,
  client_folder_id,
  client_label,
  title,
  brief,
  primary_cta,
  reference_links,
  target_audience,
  tone_of_voice,
  target_keywords,
  language,
  service_tier,
  intake_details,
  word_count,
  due_date,
  status,
  budget_cents
)
values
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444',
    'Acme Robotics',
    'Warehouse automation article',
    'Explain the operational wins from warehouse automation for mid-market logistics teams.',
    'Book a strategy call',
    '{"https://example.com/brief","https://example.com/competitor"}',
    'Mid-market logistics teams',
    'Clear, strategic, and credible',
    '{"warehouse automation","logistics workflow"}',
    'English',
    'on-demand',
    '{"publication_route":"Guest post, external publication"}',
    1400,
    current_date + interval '5 day',
    'in_review',
    7000
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    null,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Acme Robotics',
    'Series B announcement page',
    'Create a launch page for a funding announcement with credibility and conversion in mind.',
    'Read the launch story',
    '{"https://example.com/funding","https://example.com/brand"}',
    'Fintech founders and operators',
    'Confident and clear',
    '{"series b funding","press announcement"}',
    'English',
    'rank',
    '{"blog_route":"Brand blog, owned channel"}',
    1200,
    current_date + interval '7 day',
    'open',
    18000
  )
on conflict (id) do nothing;
