"use client";

import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { isNewOrderLink, navIconName, NavIcon } from "@/components/nav-icon";
import { rolePath, type Role } from "@/lib/types";

/**
 * Phone and tablet menu: the main pages sit in a bar at the bottom of the
 * screen, and "More" opens the full menu (every item, plus Sign out).
 */
export function DashboardMobileNav({
  items,
  currentPath,
  role,
}: {
  role: Role;
  items: Array<{ label: string; href: string }>;
  currentPath: string;
  /** Kept for callers; the logo link now sits in the top row of the page. */
  logoHref?: string;
}) {
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    const [itemPath] = href.split("?");
    return href === rolePath(role)
      ? currentPath === itemPath
      : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  // Clients get the pages they use most; everyone else gets their first four.
  const preferred = ["/client", "/client/orders", "/client/new-order", "/client/content-budget"];
  const main =
    role === "client"
      ? preferred
          .map((href) => items.find((item) => item.href === href))
          .filter((item): item is { label: string; href: string } => Boolean(item))
      : items.slice(0, 4);

  return (
    <div className="lg:hidden">
      {open ? (
        <div
          aria-label="Menu"
          className="fixed inset-x-2 bottom-[76px] z-50 max-h-[70vh] overflow-y-auto rounded-[18px] border border-[rgba(23,37,63,0.18)] bg-white p-3 shadow-[0_20px_50px_-10px_rgba(15,26,46,0.35)]"
          role="dialog"
        >
          <nav className="grid gap-0.5">
            {items.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-[15px] font-semibold ${
                  isActive(item.href)
                    ? "bg-[var(--penned-navy)] text-white"
                    : "text-[var(--penned-navy)] hover:bg-[#eef4f8]"
                }`}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                <NavIcon name={navIconName(item.href)} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t border-[rgba(23,37,63,0.11)] pt-2">
            <form action={signOutAction}>
              <button
                className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold text-[var(--penned-navy)] hover:bg-[#eef4f8]"
                type="submit"
              >
                <NavIcon name="out" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-[rgba(23,37,63,0.11)] bg-white px-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5"
      >
        {main.map((item) => {
          const active = isActive(item.href) && !open;
          const newOrder = isNewOrderLink(item.href);
          return (
            <Link
              key={`tab-${item.href}`}
              aria-current={active ? "page" : undefined}
              className={`grid justify-items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10.5px] font-semibold ${
                active ? "bg-[#eef4f8] text-[var(--penned-navy)]" : newOrder ? "text-[var(--penned-navy)]" : "text-[rgba(23,37,63,0.55)]"
              }`}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <span className={newOrder ? "flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--penned-lime)]" : "flex h-[26px] items-center"}>
                <NavIcon name={navIconName(item.href)} size={newOrder ? 18 : 22} />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={`grid justify-items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10.5px] font-semibold ${
            open ? "bg-[#eef4f8] text-[var(--penned-navy)]" : "text-[rgba(23,37,63,0.55)]"
          }`}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="flex h-[26px] items-center">
            <NavIcon name="more" size={22} />
          </span>
          <span>{open ? "Close" : "More"}</span>
        </button>
      </nav>
    </div>
  );
}
