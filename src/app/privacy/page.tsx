import { LegalPageShell } from "@/components/legal-page-shell";

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-600">Privacy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
          Privacy basics for Penned
        </h1>
        <article className="mt-10 rounded-[2rem] border border-white/80 bg-white/90 p-8 text-base leading-8 text-slate-600 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
          <p>
            Penned stores workspace profile data, order briefs, submissions, billing references, and
            operational activity required to run the platform. Workspace data is stored in Supabase
            and billing events are synced from Stripe. Access is controlled by application role and
            protected routes.
          </p>
        </article>
      </div>
    </LegalPageShell>
  );
}
