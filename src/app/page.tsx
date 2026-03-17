import Link from "next/link";
import {
  adminHighlights,
  clientHighlights,
  executionRoadmap,
  writerHighlights,
} from "@/lib/mock-data";

const architecture = [
  "Next.js App Router for product surfaces, marketing, and internal tools.",
  "Supabase Postgres for orders, submissions, rankings, payouts, and analytics snapshots.",
  "Clerk for authentication when ready; demo mode uses role cookies so the app runs today.",
  "Stripe Billing plus Connect for subscriptions, invoices, and writer payouts.",
];

const repoIncludes = [
  "Landing page with a product narrative and delivery roadmap.",
  "Client, writer, and admin dashboards with realistic seeded data.",
  "Role-based dashboard routing via a lightweight middleware and demo role switcher.",
  "Supabase schema v1 and environment template for the production integrations.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffd8bf_0%,#fff6ef_42%,#f4efe8_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-8 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(49,32,20,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-700">
                Penned dashboard MVP
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
                A publishing ops dashboard for clients, writers, and admins.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                I narrowed your roadmap into a launchable core: ordering,
                claiming, submissions, revisions, billing, payouts, rankings,
                and admin oversight. The repo is scaffolded to run in demo mode
                now and slot into Clerk, Supabase, and Stripe later.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="button-primary" href="/switch-role?role=client&next=/client">
                Open client dashboard
              </Link>
              <Link className="button-secondary" href="/switch-role?role=writer&next=/writer">
                Open writer dashboard
              </Link>
              <Link className="button-secondary sm:col-span-2" href="/switch-role?role=admin&next=/admin">
                Open admin dashboard
              </Link>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-950 p-6 text-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-orange-300">
                    Launch boundary
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    What ships in MVP
                  </h2>
                </div>
                <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-orange-200">
                  Beta ready
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FeaturePanel
                  title="Client flow"
                  items={clientHighlights}
                  accent="text-orange-200"
                />
                <FeaturePanel
                  title="Writer flow"
                  items={writerHighlights}
                  accent="text-emerald-200"
                />
                <FeaturePanel
                  title="Admin flow"
                  items={adminHighlights}
                  accent="text-sky-200"
                />
                <FeaturePanel
                  title="Repo foundation"
                  items={repoIncludes}
                  accent="text-violet-200"
                />
              </div>
            </div>
            <aside className="grid gap-4">
              <InfoCard
                eyebrow="Architecture"
                title="Suggested stack"
                items={architecture}
              />
              <InfoCard
                eyebrow="Build sequence"
                title="12-week roadmap"
                items={executionRoadmap.map(
                  (phase) => `${phase.weeks}: ${phase.title} - ${phase.goal}`,
                )}
              />
            </aside>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          <ExperienceCard
            title="Client workspace"
            stat="14 active orders"
            description="Clients can create orders, review submissions, request revisions, and track billing."
            href="/switch-role?role=client&next=/client"
            tone="from-orange-200 via-amber-100 to-white"
          />
          <ExperienceCard
            title="Writer workspace"
            stat="$4,860 queued earnings"
            description="Writers can claim jobs, submit drafts, monitor rank, and request payouts."
            href="/switch-role?role=writer&next=/writer"
            tone="from-emerald-200 via-teal-100 to-white"
          />
          <ExperienceCard
            title="Admin workspace"
            stat="$48.2k monthly revenue"
            description="Admins oversee operations, ranking inputs, payouts, disputes, and catalog controls."
            href="/switch-role?role=admin&next=/admin"
            tone="from-sky-200 via-cyan-100 to-white"
          />
        </section>
      </section>
    </main>
  );
}

function FeaturePanel({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <h3 className={`text-sm font-semibold uppercase tracking-[0.25em] ${accent}`}>
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(50,31,20,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h2>
      <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ExperienceCard({
  title,
  stat,
  description,
  href,
  tone,
}: {
  title: string;
  stat: string;
  description: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.75rem] border border-white/70 bg-gradient-to-br ${tone} p-6 shadow-[0_24px_48px_rgba(49,32,20,0.08)] transition-transform duration-200 hover:-translate-y-1`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
        Dashboard
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h2>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
      <div className="mt-8 flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          {stat}
        </span>
        <span className="text-sm font-medium text-slate-700 transition-transform duration-200 group-hover:translate-x-1">
          Explore
        </span>
      </div>
    </Link>
  );
}
