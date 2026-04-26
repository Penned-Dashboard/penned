insert into public.profiles (id, external_auth_id, email, full_name, role, company_name)
values
  ('11111111-1111-1111-1111-111111111111', 'seed-client', 'client@penned.dev', 'Penned Client Seed', 'client', 'Penned Labs'),
  ('22222222-2222-2222-2222-222222222222', 'seed-writer', 'writer@penned.dev', 'Penned Writer Seed', 'writer', null),
  ('33333333-3333-3333-3333-333333333333', 'seed-admin', 'admin@penned.dev', 'Penned Admin Seed', 'admin', 'Penned')
on conflict (id) do nothing;

insert into public.content_types (id, name, description, base_price_cents, turnaround_days, active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Blog post', 'SEO article or thought leadership post.', 35000, 5, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Landing page', 'Conversion-focused marketing page.', 55000, 6, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Case study', 'Customer story with proof points and outcomes.', 70000, 7, true),
  ('ddddaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Email sequence', 'Lifecycle, nurture, or launch emails for campaigns.', 28000, 4, true),
  ('eeeebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Product page', 'Feature-led web copy focused on clarity and conversion.', 42000, 5, true),
  ('ffffcccc-cccc-cccc-cccc-cccccccccccc', 'LinkedIn post', 'Founder-led social content for authority and reach.', 12000, 2, true),
  ('1111dddd-dddd-dddd-dddd-dddddddddddd', 'Newsletter', 'Editorial or growth newsletter issue with sections and CTA.', 26000, 3, true),
  ('2222eeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Whitepaper', 'Long-form gated asset with research-driven structure.', 95000, 10, true),
  ('3333ffff-ffff-ffff-ffff-ffffffffffff', 'Press release', 'Announcement copy formatted for launch and media outreach.', 32000, 3, true)
on conflict (id) do nothing;

insert into public.orders (
  id,
  client_id,
  writer_id,
  content_type_id,
  title,
  brief,
  primary_cta,
  reference_links,
  target_audience,
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
    'Warehouse automation article',
    'Explain the operational wins from warehouse automation for mid-market logistics teams.',
    'Book a strategy call',
    '{"https://example.com/brief","https://example.com/competitor"}',
    'Mid-market logistics teams',
    current_date + interval '5 day',
    'in_review',
    42000
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    null,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Series B announcement page',
    'Create a launch page for a funding announcement with credibility and conversion in mind.',
    'Read the launch story',
    '{"https://example.com/funding","https://example.com/brand"}',
    'Fintech founders and operators',
    current_date + interval '7 day',
    'open',
    56000
  )
on conflict (id) do nothing;
