import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function AboutPage() {
  return (
    <MarketingPageShell
      eyebrow="About Penned"
      title="A lighter operations layer for content teams."
      description="Penned brings briefs, writers, reviews, billing, and payouts into one calmer workflow so teams can ship content without juggling disconnected tools."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "For clients",
            body: "Create detailed briefs, track status, review drafts, and manage billing from one place.",
          },
          {
            title: "For writers",
            body: "Claim work, submit Google Docs, respond to feedback, and keep payout visibility simple.",
          },
          {
            title: "For operators",
            body: "Run the marketplace, approve payouts, manage content types, and keep order flow healthy.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_60px_rgba(25,38,63,0.06)]"
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {item.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-500">{item.body}</p>
          </article>
        ))}
      </div>
    </MarketingPageShell>
  );
}
