import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { roleMeta } from "@/lib/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/lib/types";

export function DashboardShell({
  role,
  title,
  description,
  ctaLabel,
  ctaHref,
  currentPath,
  userName,
  searchQuery,
  tabs,
  children,
}: {
  role: Role;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  currentPath: string;
  userName: string;
  searchQuery?: string;
  tabs?: { label: string; href: string; active?: boolean }[];
  children: ReactNode;
}) {
  const meta = roleMeta[role];
  const workspaceHref = `/${role}`;
  const settingsHref = `/${role}/settings`;
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#f5f7fb]">
      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="border-r border-white/5 bg-[#171c25] px-4 py-6 text-slate-100">
          <Link href={`/${role}`} className="flex items-center gap-3 rounded-2xl px-3 py-2">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accentClass} text-sm font-semibold text-white`}
            >
              P
            </span>
            <div>
              <p className="font-semibold">{meta.portalTitle}</p>
              <p className="text-sm text-slate-400">{meta.portalSubtitle}</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-2">
            {meta.nav.map((item) => {
              const isActive =
                currentPath === item.href ||
                (!item.href.includes("#") &&
                  item.href !== "/" &&
                  currentPath.startsWith(`${item.href}/`)) ||
                (item.href.includes("#") && currentPath === item.href.split("#")[0]);

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  className={
                    isActive
                      ? "flex items-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-medium text-white"
                      : "flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800/70 hover:text-white"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 border-t border-white/10 pt-6">
            <Link
              className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800/70 hover:text-white"
              href="/"
            >
              Back to site
            </Link>
          </div>
        </aside>

        <div className="px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <form
                  action={workspaceHref}
                  className="hidden min-w-72 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex"
                  method="get"
                >
                  <input
                    aria-label="Search workspace"
                    className="w-full bg-transparent px-1 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    defaultValue={searchQuery}
                    name="q"
                    placeholder="Search workspace..."
                    type="search"
                  />
                  <button className="text-sm font-medium text-slate-500" type="submit">
                    Search
                  </button>
                </form>
                <Link
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-semibold text-white transition hover:scale-[1.02]"
                  href={settingsHref}
                  title="Open settings"
                >
                  {initials || "P"}
                </Link>
                <form action={signOutAction}>
                  <button className="button-secondary" type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            </div>

            <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="button-primary" href={ctaHref}>
                  {ctaLabel}
                </Link>
              </div>
            </header>
            {tabs?.length ? (
              <nav className="mb-6 flex items-center gap-8 border-b border-slate-200">
                {tabs.map((tab) => (
                  <Link
                    key={`${tab.label}-${tab.href}`}
                    className={
                      tab.active
                        ? "border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-600"
                        : "pb-3 text-sm font-medium text-slate-500"
                    }
                    href={tab.href}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <div className="grid gap-4">{children}</div>
          </div>
        </div>
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
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(25,38,63,0.04)]">
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
    <section
      id={id}
      className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(25,38,63,0.04)] md:p-6"
    >
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
