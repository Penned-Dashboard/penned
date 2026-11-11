"use client";

import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import { rolePath, type Role } from "@/lib/types";

export function DashboardMobileNav({
  items,
  currentPath,
  logoHref,
  role,
}: {
  role: Role;
  items: Array<{ label: string; href: string }>;
  currentPath: string;
  logoHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--penned-navy)] px-4 py-3 text-white">
        <Link href={logoHref} className="flex items-center gap-2">
          <PennedLogo tone="light" />
        </Link>
        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {items.map((item) => {
              const [itemPath] = item.href.split("?");
              const isActive =
                item.href === rolePath(role)
                  ? currentPath === itemPath
                  : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  className={
                    isActive
                      ? "block rounded-xl bg-[var(--penned-sky)] px-4 py-3 text-sm font-semibold text-[var(--penned-navy)]"
                      : "block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  }
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <form action={signOutAction}>
              <button className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
