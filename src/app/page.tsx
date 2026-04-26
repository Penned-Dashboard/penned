import Link from "next/link";
import { AppAuthBar } from "@/components/app-auth-bar";
import { getCurrentAppUser } from "@/lib/auth";

const features = [
  {
    title: "Client ordering",
    body: "Submit briefs, track revisions, review drafts, and keep every content request moving in one workspace.",
  },
  {
    title: "Writer marketplace",
    body: "Let vetted writers claim work, submit Google Docs, and respond to revision feedback without inbox chaos.",
  },
  {
    title: "Operations control",
    body: "Approve payouts, monitor ranking signals, manage content types, and keep order flow healthy from one admin hub.",
  },
];

const writerBenefits = [
  "Claim open assignments from a live marketplace.",
  "Submit drafts with Google Docs and revision notes.",
  "Track active jobs, payouts, wallet activity, and rank.",
];

const pricing = [
  {
    name: "Starter",
    price: "$0/mo",
    detail: "Create your workspace, explore the dashboard, and get set up before you start paying.",
  },
  {
    name: "Basic",
    price: "$499/mo",
    detail: "For teams that need dependable ordering, review, and delivery workflows.",
  },
  {
    name: "Pro",
    price: "$999/mo",
    detail: "Adds premium support, preferred-writer workflow, and deeper operational visibility.",
  },
];

export default async function Home() {
  const user = await getCurrentAppUser();
  const primaryHeroHref = !user
    ? "/sign-up?role=client"
    : user.role === "client"
      ? "/client"
      : user.role === "admin"
        ? "/admin"
        : "/#features";
  const primaryHeroLabel = !user
    ? "Start Ordering Content"
    : user.role === "client"
      ? "Open Client Workspace"
      : user.role === "admin"
        ? "Open Admin Console"
        : "See Platform Features";
  const secondaryHeroHref = !user
    ? "/sign-up?role=writer"
    : user.role === "writer"
      ? "/writer"
      : user.role === "admin"
        ? "/admin"
        : "/#writers";
  const secondaryHeroLabel = !user
    ? "Join as Writer"
    : user.role === "writer"
      ? "Open Writer Workspace"
      : user.role === "admin"
        ? "Open Admin Console"
        : "See Writer Workflow";
  const writerHref = !user
    ? "/sign-up?role=writer"
    : user.role === "writer"
      ? "/writer"
      : "/#writers";
  const writerSecondaryHref =
    user?.role === "client" ? "/client" : user?.role === "writer" ? "/writer" : "/#features";
  const writerSecondaryLabel =
    user?.role === "client"
      ? "Open Client Workspace"
      : user?.role === "writer"
        ? "Back to Your Workspace"
        : "See Platform Features";
  const workspaceLinks = user
    ? user.role === "client"
      ? [
          { label: "Client Workspace", href: "/client" },
          { label: "New Order", href: "/client/new-order" },
          { label: "Billing", href: "/client/billing" },
        ]
      : user.role === "writer"
        ? [
            { label: "Writer Workspace", href: "/writer" },
            { label: "Job Marketplace", href: "/writer#job-marketplace" },
            { label: "Earnings", href: "/writer#earnings" },
          ]
        : [
            { label: "Admin Console", href: "/admin" },
            { label: "Orders", href: "/admin#operations" },
            { label: "Payouts", href: "/admin#payouts" },
          ]
    : [
        { label: "Client Sign Up", href: "/sign-up?role=client" },
        { label: "Writer Sign Up", href: "/sign-up?role=writer" },
        { label: "Admin Sign In", href: "/sign-in" },
      ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-900">
      <AppAuthBar />
      <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] bg-[radial-gradient(circle_at_15%_20%,rgba(255,210,182,0.35),transparent_18%),radial-gradient(circle_at_75%_18%,rgba(131,216,255,0.22),transparent_24%),radial-gradient(circle_at_85%_40%,rgba(81,187,176,0.14),transparent_20%),linear-gradient(180deg,#f6f8fc_0%,#eef3f8_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] opacity-35 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0,rgba(255,255,255,0)_58%),linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:auto,140px_140px,140px_140px]" />

      <section className="mx-auto max-w-7xl px-6 pb-6 pt-12 lg:px-10">
        <div className="flex min-h-[52rem] flex-col items-center justify-center text-center">
          <div className="rounded-full border border-white/80 bg-white/85 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_16px_40px_rgba(25,38,63,0.06)]">
            Trusted by 500+ brands worldwide
          </div>
          <h1 className="mt-10 max-w-5xl text-6xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-7xl">
            Premium Content,
            <span className="block bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>
          <p className="mt-8 max-w-3xl text-2xl leading-10 text-slate-500">
            Connect with expert writers. Order blog posts, articles, web copy,
            and more. Review, approve, and publish from one smooth platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link className="inline-flex min-w-64 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] px-7 py-5 text-lg font-semibold text-white shadow-[0_24px_40px_rgba(37,99,235,0.25)] transition-transform duration-200 hover:-translate-y-0.5" href={primaryHeroHref}>
              {primaryHeroLabel}
            </Link>
            <Link className="inline-flex min-w-56 items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-5 text-lg font-semibold text-slate-800 shadow-[0_20px_35px_rgba(25,38,63,0.06)] transition-transform duration-200 hover:-translate-y-0.5" href={secondaryHeroHref}>
              {secondaryHeroLabel}
            </Link>
          </div>
          <div className="mt-16 grid gap-10 text-center sm:grid-cols-3">
            <Stat value="2,400+" label="Active Writers" />
            <Stat value="50K+" label="Content Delivered" />
            <Stat value="4.8★" label="Avg. Rating" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24 lg:px-10">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-teal-500">
          Features
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_60px_rgba(25,38,63,0.06)]"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {feature.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-500">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="writers" className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="rounded-[2.5rem] border border-white/80 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(43,182,168,0.08))] p-10 shadow-[0_30px_70px_rgba(25,38,63,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-500">
            For Writers
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-5xl font-semibold tracking-[-0.05em] text-slate-950">
                A cleaner workflow for great writers.
              </h2>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-500">
                Penned gives writers a live marketplace, structured briefs,
                faster approvals, and clear payout visibility without juggling
                fragmented tools.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="button-primary rounded-2xl px-6 py-4 text-base" href={writerHref}>
                  {user?.role === "writer" ? "Open Writer Workspace" : "Explore Writer Workflow"}
                </Link>
                <Link className="button-secondary rounded-2xl px-6 py-4 text-base" href={writerSecondaryHref}>
                  {writerSecondaryLabel}
                </Link>
              </div>
            </div>
            <div className="grid gap-4">
              {writerBenefits.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 text-base leading-7 text-slate-600 shadow-[0_20px_45px_rgba(25,38,63,0.05)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f3f7fb] px-6 py-28 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-500">
            Pricing
          </p>
          <h2 className="mt-6 text-6xl font-semibold tracking-[-0.05em] text-slate-950">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-5 text-2xl leading-9 text-slate-500">
            Scale your content production without scaling your headcount.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className="rounded-[2rem] border border-white/80 bg-white/90 p-8 text-left shadow-[0_24px_60px_rgba(25,38,63,0.05)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {plan.name}
                </p>
                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  {plan.price}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-500">
                  {plan.detail}
                </p>
                <Link
                  className="button-primary mt-6 rounded-2xl px-5 py-3 text-sm"
                  href={resolvePlanHref(plan.name, user?.role)}
                >
                  {resolvePlanLabel(plan.name, user?.role)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="about" className="border-t border-slate-200 bg-white px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] text-sm font-semibold text-white">
                P
              </span>
              <span className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Penned
              </span>
            </div>
            <p className="mt-5 max-w-xs text-lg leading-8 text-slate-500">
              Premium content at scale. Connect with expert writers and grow
              your publishing engine.
            </p>
          </div>
          <FooterColumn
            title="Platform"
            links={[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "For Writers", href: "#writers" },
              { label: "About", href: "/about" },
            ]}
          />
          <FooterColumn
            title={user ? "Workspace" : "Get Started"}
            links={workspaceLinks}
          />
          <FooterColumn
            title="Company"
            links={[
              { label: "Contact", href: "/contact" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Security", href: "/security" },
            ]}
          />
        </div>
        <div className="mx-auto mt-14 max-w-7xl border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © 2026 Penned. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function resolvePlanHref(planName: string, role?: "client" | "writer" | "admin") {
  if (!role) {
    return planName === "Starter" ? "/sign-up?role=client" : "/sign-up?role=client";
  }

  if (role === "client") {
    return planName === "Starter" ? "/client" : "/client/billing";
  }

  if (role === "writer") {
    return planName === "Starter" ? "/writer" : "/contact";
  }

  return planName === "Starter" ? "/admin" : "/contact";
}

function resolvePlanLabel(planName: string, role?: "client" | "writer" | "admin") {
  if (!role) {
    return planName === "Starter" ? "Get Started Free" : "Create Client Account";
  }

  if (role === "client") {
    return planName === "Starter" ? "Open Workspace" : "View Billing";
  }

  if (role === "writer") {
    return planName === "Starter" ? "Open Workspace" : "Talk to Team";
  }

  return planName === "Starter" ? "Open Console" : "Talk to Team";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-5xl font-semibold tracking-[-0.05em] text-slate-700">
        {value}
      </p>
      <p className="mt-3 text-xl text-slate-400">{label}</p>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-lg font-semibold text-slate-950">{title}</p>
      <div className="mt-5 flex flex-col gap-4 text-lg text-slate-500">
        {links.map((link) => (
          <Link key={link.label} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
