import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function SecurityPage() {
  return (
    <MarketingPageShell
      eyebrow="Security"
      title="Current security posture and next hardening steps."
      description="The MVP now has role-aware app access, but database-level protections still need a dedicated RLS pass before production launch."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {[
          "Roles are enforced in application routing and page-level guards.",
          "Supabase service-role access is still used server-side for some flows.",
          "Stripe webhook verification is ready once the signing secret is added.",
          "Next production step is enabling RLS and narrowing all write paths.",
        ].map((item) => (
          <div
            key={item}
            className="rounded-[2rem] border border-white/80 bg-white/85 p-6 text-base leading-8 text-slate-500 shadow-[0_24px_60px_rgba(25,38,63,0.06)]"
          >
            {item}
          </div>
        ))}
      </div>
    </MarketingPageShell>
  );
}
