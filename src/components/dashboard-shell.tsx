import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { isNewOrderLink, navGroupHeading, navIconName, NavIcon } from "@/components/nav-icon";
import { NotificationBell } from "@/components/notification-bell";
import { PennedLogo } from "@/components/penned-logo";
import { RoleSwitcherPanel } from "@/components/role-switcher-panel";
import { roleMeta } from "@/lib/navigation";
import { roleLabel, rolePath, type Role } from "@/lib/types";
import type { ReactNode } from "react";

export { SectionCard, StatCard } from "@/components/dashboard-cards";

export function DashboardShell({
  role,
  title,
  titleStyle,
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
  /** "welcome" sets the title in the serif, for the client's greeting. */
  titleStyle?: "welcome";
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
  const workspaceHref = rolePath(role);
  const settingsHref = `${rolePath(role)}/settings`;
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logoHref = role === "client" ? "https://penned.io" : rolePath(role);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden bg-[var(--penned-navy)] px-3.5 pb-4 pt-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <Link href={logoHref} className="flex items-center gap-3 rounded-xl px-3 py-1">
            <PennedLogo compact tone="light" />
          </Link>
          {meta.portalSubtitle ? (
            <p className="mt-4 px-3 text-[11.5px] font-bold uppercase tracking-[0.16em] text-[var(--penned-sky)]">
              {meta.portalSubtitle}
            </p>
          ) : null}

          <nav className="mt-3">
            {meta.nav.map((item, index) => {
              const workspaceRoot = rolePath(role);
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
              const heading = navGroupHeading(item.href, index);
              const isNewOrder = isNewOrderLink(item.href);

              return (
                <div key={`${item.label}-${item.href}`}>
                  {heading ? <p className="shell-nav-heading">{heading}</p> : null}
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`shell-nav-link ${isNewOrder ? "is-new-order" : ""} ${isActive ? "is-active" : ""}`}
                    href={item.href}
                  >
                    <NavIcon name={navIconName(item.href)} />
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <RoleSwitcherPanel currentRole={role} />
            <div className="mt-4 border-t border-white/15 pt-3">
              <div className="flex min-h-14 items-center gap-3 px-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--penned-sky)] text-[12.5px] font-bold text-[var(--penned-navy)]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
                  ) : (
                    initials
                  )}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[15px] font-bold">{userName}</span>
                  <span className="block truncate text-[13px] text-white/60">{roleLabel(role)}</span>
                </span>
              </div>
              <form action={signOutAction}>
                <button className="shell-nav-link w-full text-left" type="submit">
                  <NavIcon name="out" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="px-4 pb-28 pt-4 sm:px-6 lg:px-9 lg:pb-20 lg:pt-[18px]">
          <div className="mx-auto max-w-[1208px]">
            <DashboardMobileNav
              currentPath={currentPath}
              items={meta.nav}
              logoHref={logoHref}
              role={role}
            />
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link href={logoHref} className="flex items-center lg:hidden">
                <PennedLogo compact />
              </Link>
              <form
                action={searchAction ?? workspaceHref}
                className="shell-search hidden sm:flex"
                method="get"
              >
                <NavIcon name="search" />
                <input
                  aria-label="Search workspace"
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--penned-navy)] outline-none placeholder:text-[rgba(23,37,63,0.5)]"
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
                <button className="button-primary button-small shrink-0" type="submit">
                  Search
                </button>
              </form>
              <div className="ml-auto flex items-center gap-3">
                <NotificationBell />
                <Link
                  className="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-full bg-[var(--penned-navy)] text-sm font-bold text-white"
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

            <header className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="min-w-0">
                <h1 className={titleStyle === "welcome" ? "shell-title is-welcome" : "shell-title"}>{title}</h1>
                {showDescription ? <p className="shell-description">{description}</p> : null}
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
              <nav className="shell-tabs">
                {tabs.map((tab) => (
                  <Link
                    key={`${tab.label}-${tab.href}`}
                    className={tab.active ? "shell-tab is-active" : "shell-tab"}
                    href={tab.href}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <div className="grid gap-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
