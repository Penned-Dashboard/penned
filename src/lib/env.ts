export function hasSupabaseServerEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasSupabaseBrowserEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasStripeEnv() {
  // Publishable key can be STRIPE_PUBLISHABLE_KEY (Vercel Sensitive) or the older NEXT_PUBLIC_ name.
  // Checkout/portal only need STRIPE_SECRET_KEY on the server; the pk_ value is just a presence check for now.
  const publishable =
    process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return Boolean(process.env.STRIPE_SECRET_KEY && publishable);
}
