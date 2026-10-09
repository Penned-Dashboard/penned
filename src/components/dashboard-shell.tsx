import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import { RoleSwitcherPanel } from "@/components/role-switcher-panel";
import { roleMeta } from "@/lib/navigation";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

export { SectionCard, StatCard } from "@/components/dashboard-cards";

export function DashboardShell({
  role,
  title,
  description,
  ctaLabel,
  ctaHref,
  currentPath,
  userName,
  searchQuery,
  searchAction,
  tabs,
  children,
}: {
  role: Role;
  title: string;
  description: string;
  /** Omit both to hide the header primary CTA (e.g. when Next Action already owns it). */
  ctaLabel?: string;
  ctaHref?: string;
  currentPath: string;
  userName: string;
  searchQuery?: string;
  /** Path the search form submits to. Defaults to the role workspace root. */
  searchAction?: string;
  tabs?: { label: string; href: string; active?: boolean }[];
  children: ReactNode;
}) {
  const showHeaderCta = Boolean(ctaLabel && ctaHref);
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
    <main className="min-h-[calc(100vh-73px)] bg-[var(--background)]">
      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[var(--penned-navy)] px-4 py-6 text-slate-100">
          <Link href={`/${role}`} className="flex items-center gap-3 rounded-2xl px-3 py-2">
            <PennedLogo tone="light" />
          </Link>
          <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--penned-sky)]">
            {meta.portalSubtitle}
          </p>

          <nav className="mt-8 space-y-2">
            {meta.nav.map((item) => {
              const workspaceRoot = `/${role}`;
              const isActive = item.href.includes("#")
                ? currentPath === item.href.split("#")[0]
                : item.href === workspaceRoot
                  ? currentPath === item.href
                  : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  className={
                    isActive
                      ? "flex items-center rounded-2xl bg-[var(--penned-lime)] px-4 py-3 text-sm font-semibold text-[var(--penned-navy)]"
                      : "flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <RoleSwitcherPanel currentRole={role} />

          <div className="mt-10 border-t border-white/10 pt-6">
            <Link
              className="flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              href="/"
            >
              Back to site
            </Link>
          </div>
        </aside>

        <div className="px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[rgba(23,37,63,0.1)] pb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--penned-navy)]">
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <form
                  action={searchAction ?? workspaceHref}
                  className="hidden min-w-72 items-center gap-2 rounded-2xl border border-[rgba(23,37,63,0.1)] bg-white px-3 py-2 md:flex"
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
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-sm font-semibold text-[var(--penned-lime)] transition hover:scale-[1.02]"
                  href={settingsHref}
                  title="Open settings"
                >
                  {initials || (
                    <Image alt="" height={40} src="/brand/penned-mark.svg" width={40} />
                  )}
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
              {showHeaderCta ? (
                <div className="flex flex-wrap gap-3">
                  <Link className="button-primary" href={ctaHref!}>
                    {ctaLabel}
                  </Link>
                </div>
              ) : null}
            </header>
            {tabs?.length ? (
              <nav className="mb-6 flex items-center gap-8 border-b border-[rgba(23,37,63,0.1)]">
                {tabs.map((tab) => (
                  <Link
                    key={`${tab.label}-${tab.href}`}
                    className={
                      tab.active
                        ? "border-b-2 border-[var(--penned-navy)] pb-3 text-sm font-semibold text-[var(--penned-navy)]"
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
