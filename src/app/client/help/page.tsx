import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { formatUsdFromCents, pricingSettings } from "@/lib/pricing";

const faqs = [
  {
    q: "Which writing level should I choose?",
    a: "Pick per client, not per account. Standard is for content at volume, with AI-assisted drafting and a human edit. Signature is for clients who want every word written by a person, with an AI-detection report. Specialist is for regulated and technical niches like iGaming, fintech, insurance, medical and legal. Not sure? Ask your account manager.",
  },
  {
    q: "Do other languages cost more?",
    a: "On Signature and Specialist, no: every language costs the same as English. On Standard, languages other than English add $0.02 per word.",
  },
  {
    q: "How long does an order take?",
    a: "72 hours from when we accept your brief, or 48 hours with Rush. If a piece is at risk, we'll tell you before the deadline. If it's still late, 25% of the price goes back on your balance.",
  },
  {
    q: "How do revisions work?",
    a: "We aim for publish-ready, and revisions are free for 14 days after delivery, within the original brief. Open the order and click Request changes. A change to the brief is a new order.",
  },
  {
    q: "How do top-ups and pre-pay credit work?",
    a: "Top up your budget and every order draws from it. Pre-pay $5,000 or more and we add extra credit: 5% from $5,000, 7.5% from $12,500 and 10% from $25,000.",
  },
  {
    q: "How do approvals work?",
    a: "Set rules in Settings. Orders that need sign-off wait under Orders → Waiting for approval.",
  },
];

export default async function ClientHelpPage() {
  const user = await requireRole("client");

  return (
    <DashboardShell
      currentPath="/client/help"
      description=""
      role="client"
      title="Help"
      userName={user.fullName}
    >
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard description="Ask about orders, budgets or payment terms. Honest advice, no sales pitch." title="Your account manager">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Your account manager</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--penned-navy)]">{user.fullName.split(" ")[0] || "Penned"}</p>
          <p className="mt-2 text-sm text-slate-500">
            Your Penned account manager can help with writing levels, delivery and billing.
          </p>
          <a className="button-primary mt-6 inline-flex" href="mailto:hello@fipublishing.com">
            Message account manager
          </a>
        </SectionCard>

        <SectionCard description="A dashboard walkthrough, planning upcoming content, or feedback on a piece." title="Book a call">
          <p className="text-sm text-slate-500">Pick a time that suits you.</p>
          <a
            className="button-primary mt-6 inline-flex"
            href="https://calendly.com/contact-howlpublishing/30min"
            rel="noreferrer"
            target="_blank"
          >
            Choose a time
          </a>
          <p className="mt-4 text-xs text-slate-400">
            Opens Calendly in a new tab. You can choose what you&apos;d like to cover there.
          </p>
        </SectionCard>
      </section>

      <SectionCard description="" title="Quick answers">
        <div className="space-y-4">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4">
              <summary className="cursor-pointer list-none text-base font-semibold text-[var(--penned-navy)]">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Current launch rates: Standard {formatUsdFromCents(pricingSettings.standardCents)}/word · Signature{" "}
          {formatUsdFromCents(pricingSettings.signatureCents)}/word · Specialist from{" "}
          {formatUsdFromCents(pricingSettings.specialistCents)}/word.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-[var(--penned-navy)] underline" href="/client/new-order">
          Place an order
        </Link>
      </SectionCard>
    </DashboardShell>
  );
}
