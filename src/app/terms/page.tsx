import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function TermsPage() {
  return (
    <MarketingPageShell
      eyebrow="Terms"
      title="Platform terms for the Penned MVP."
      description="These terms summarize how Penned workspaces, content orders, billing, and payouts are expected to operate during MVP use."
    >
      <article className="rounded-[2rem] border border-white/80 bg-white/85 p-8 text-base leading-8 text-slate-500 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
        <p>
          Clients are responsible for the briefs they submit, writers are responsible for original deliverables, and
          admins operate the order, payout, and dispute workflow. Stripe billing and payout behavior depends on the
          configured product and webhook settings in the active environment.
        </p>
      </article>
    </MarketingPageShell>
  );
}
