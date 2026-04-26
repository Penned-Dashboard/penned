import Link from "next/link";
import { MarketingPageShell } from "@/components/marketing-page-shell";

export default function ContactPage() {
  return (
    <MarketingPageShell
      eyebrow="Contact"
      title="Talk to the Penned team."
      description="For onboarding, support, billing questions, or writer applications, use the contact options below."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Email
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-500">
            Reach us directly and we will route your request to the right workflow.
          </p>
          <Link className="button-primary mt-6" href="mailto:hello@penned.io">
            hello@penned.io
          </Link>
        </article>
        <article className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Start a workspace
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-500">
            New clients can create access immediately and writers can join the marketplace flow from the main onboarding path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-primary" href="/sign-up?role=client">
              Client sign-up
            </Link>
            <Link className="button-secondary" href="/sign-up?role=writer">
              Writer sign-up
            </Link>
          </div>
        </article>
      </div>
    </MarketingPageShell>
  );
}
