import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { PennedLogo } from "@/components/penned-logo";
import { RoleSwitcherPanel } from "@/components/role-switcher-panel";
import { roleMeta } from "@/lib/navigation";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

export { SectionCard, StatCard } from "@/components/dashboard-cards";

export function DashboardShell({
  role,
  title,
  description = "",
  ctaLabel,
  ctaHref,
  currentPath,
  userName,
  avatarUrl,
  searchQuery,
  searchAction,
  tabs,
  children,
}: {
  role: Role;
  title: string;
  description?: string;
  /** Omit both to hide the header primary CTA (e.g. when Next Action already owns it). */
  ctaLabel?: string;
  ctaHref?: string;
  currentPath: string;
  userName: string;
  avatarUrl?: string | null;
  searchQuery?: string;
  /** Path the search form submits to. Defaults to the role workspace root. */
  searchAction?: string;
  tabs?: { label: string; href: string; active?: boolean }[];
  children: ReactNode;
}) {
  const showHeaderCta = Boolean(ctaLabel && ctaHref);
  const showDescription = Boolean(description?.trim());
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

  const logoHref = role === "client" ? "https://penned.io" : `/${role}`;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[var(--penned-navy)] px-4 py-6 text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <Link href={logoHref} className="flex items-center gap-3 rounded-2xl px-3 py-2">
            <PennedLogo tone="light" />
          </Link>
          {meta.portalSubtitle ? (
            <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--penned-sky)]">
              {meta.portalSubtitle}
            </p>
          ) : null}

          <nav className="mt-8 space-y-2">
            {meta.nav.map((item) => {
              const workspaceRoot = `/${role}`;
              const [itemPath, itemQuery = ""] = item.href.split("?");
              const [itemPathNoHash] = itemPath.split("#");
              const isHashOnly = item.href.includes("#");
              // Exact path match for workspace root; avoid Orders highlighting Dashboard children wrongly.
              const isActive = isHashOnly
                ? false
                : item.href === workspaceRoot
                  ? currentPath === itemPathNoHash
                  : currentPath === itemPathNoHash ||
                    (itemPathNoHash !== workspaceRoot &&
                      currentPath.startsWith(`${itemPathNoHash}/`));
              void itemQuery;

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  className={
                    isActive
                      ? "flex items-center rounded-2xl bg-[var(--penned-sky)] px-4 py-3 text-sm font-semibold !text-[var(--penned-navy)]"
                      : "flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <RoleSwitcherPanel currentRole={role} />
            <div className="mt-6 border-t border-white/10 pt-4">
              <form action={signOutAction}>
                <button
                  className="flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <DashboardMobileNav
              currentPath={currentPath}
              items={meta.nav}
              logoHref={logoHref}
              role={role}
            />
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[rgba(23,37,63,0.1)] pb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--penned-navy)]">
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <form
                  action={searchAction ?? workspaceHref}
                  className="hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-2xl border border-[rgba(23,37,63,0.18)] bg-white px-3 py-2 shadow-sm sm:flex sm:min-w-80 sm:flex-none"
                  method="get"
                >
                  <input
                    aria-label="Search workspace"
                    className="w-full bg-transparent px-1 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    defaultValue={searchQuery}
                    name="q"
                    placeholder="Search orders or clients"
                    type="search"
                  />
                  {searchQuery ? (
                    <Link
                      className="shrink-0 text-xs font-semibold text-slate-500 underline"
                      href={searchAction ?? workspaceHref}
                    >
                      Clear
                    </Link>
                  ) : null}
                  <button
                    className="shrink-0 rounded-xl bg-[var(--penned-navy)] px-3 py-1.5 text-xs font-semibold text-white"
                    type="submit"
                  >
                    Search
                  </button>
                </form>
                <Link
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-sm font-semibold text-white transition hover:scale-[1.02]"
                  href={settingsHref}
                  title="Open settings"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
                  ) : (
                    initials || <Image alt="" height={40} src="/brand/penned-mark.png" width={40} />
                  )}
                </Link>
              </div>
            </div>

            {showDescription || showHeaderCta ? (
              <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {showDescription ? (
                  <div>
                    <p className="max-w-3xl text-base leading-7 text-slate-500">{description}</p>
                  </div>
                ) : (
                  <div />
                )}
                {showHeaderCta ? (
                  <div className="flex flex-wrap gap-3">
                    <Link className="button-primary" href={ctaHref!}>
                      {ctaLabel}
                    </Link>
                  </div>
                ) : null}
              </header>
            ) : null}
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
