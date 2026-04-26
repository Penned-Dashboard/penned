import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function PrivacyPage() {
  return (
    <MarketingPageShell
      eyebrow="Privacy"
      title="Privacy basics for the Penned MVP."
      description="Penned stores workspace profile data, order briefs, submissions, billing references, and operational activity required to run the platform."
    >
      <article className="rounded-[2rem] border border-white/80 bg-white/85 p-8 text-base leading-8 text-slate-500 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
        <p>
          For the current MVP, workspace data is stored in Supabase and billing events are synced from Stripe.
          Access is controlled by application role and protected routes. Before production launch, row-level security
          policies should be enabled across all exposed tables.
        </p>
      </article>
    </MarketingPageShell>
  );
}
