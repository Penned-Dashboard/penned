import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { accountManagerForClient, calendlyUrl } from "@/lib/account-manager";
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

export default async function ClientHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const manager = accountManagerForClient(user.profileId);
  const reason =
    params.topic === "priority"
      ? "Priority Account status"
      : params.topic === "walkthrough"
        ? "Dashboard walkthrough"
        : undefined;

  return (
    <DashboardShell
      currentPath="/client/help"
      description=""
      role="client"
      title="Help"
      userName={user.fullName}
    >
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          description="Ask about orders, budgets or payment terms. Honest advice, no sales pitch."
          title="Your account manager"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-sm font-semibold text-white">
              {manager.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={manager.photoUrl} />
              ) : (
                manager.initials
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--penned-navy)]">{manager.name}</p>
              <p className="mt-1 text-sm text-slate-500">Your Penned account manager</p>
            </div>
          </div>
          <a
            className="button-primary mt-6 inline-flex"
            href={manager.messageUrl}
            rel="noreferrer"
            target="_blank"
          >
            Message {manager.firstName}
          </a>
        </SectionCard>

        <SectionCard
          description="A dashboard walkthrough, planning upcoming content, or feedback on a piece."
          title="Book a call"
        >
          <p className="text-sm text-slate-500">Pick a time that suits you.</p>
          <a
            className="button-primary mt-6 inline-flex"
            href={calendlyUrl(reason)}
            rel="noreferrer"
            target="_blank"
          >
            Choose a time
          </a>
          <p className="mt-4 text-xs text-slate-400">
            Opens Calendly in a new tab
            {reason ? ` with “${reason}” pre-selected` : ""}.
          </p>
        </SectionCard>
      </section>

      <SectionCard description="" title="Quick answers">
        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4"
              open={params.topic === "priority" && item.q.includes("approvals") ? false : undefined}
            >
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
