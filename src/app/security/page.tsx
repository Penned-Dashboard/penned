import Link from "next/link";
import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function SecurityPage() {
  return (
    <MarketingPageShell
      eyebrow="Security notes"
      title="This is a planning page, not an admin tool."
      description="It explains what is already locked down and what still needs hardening before launch. It does not change settings."
    >
      <div className="mb-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
        Looking for admin controls? Go to{" "}
        <Link className="font-semibold underline" href="/admin">
          Admin Dashboard
        </Link>
        ,{" "}
        <Link className="font-semibold underline" href="/admin/people">
          People
        </Link>
        , or{" "}
        <Link className="font-semibold underline" href="/admin/orders">
          All Orders
        </Link>
        .
      </div>
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
