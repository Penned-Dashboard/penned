import Link from "next/link";
import { roleMeta } from "@/lib/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/lib/types";

export function DashboardShell({
  role,
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
}: {
  role: Role;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  children: ReactNode;
}) {
  const meta = roleMeta[role];

  return (
    <main className={`min-h-screen bg-gradient-to-b ${meta.pageTone}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="dashboard-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${meta.eyebrowTone}`}>
                {meta.kicker}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" href={ctaHref}>
                {ctaLabel}
              </Link>
              <Link className="button-secondary" href="/">
                Back to overview
              </Link>
            </div>
          </div>
          <nav className="mt-8 flex flex-wrap gap-3">
            {Object.entries(roleMeta).map(([key, value]) => (
              <Link
                key={key}
                className={key === role ? "button-primary" : "button-secondary"}
                href={`/switch-role?role=${key}&next=/${key}`}
              >
                {value.navLabel}
              </Link>
            ))}
            <Link className="button-secondary" href="/dashboard">
              Open my dashboard
            </Link>
          </nav>
        </header>
        <div className="grid gap-4">{children}</div>
      </div>
    </main>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="dashboard-panel rounded-[1.5rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
      <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </article>
  );
}

export function SectionCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="dashboard-panel rounded-[1.75rem] p-5 md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Section
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
