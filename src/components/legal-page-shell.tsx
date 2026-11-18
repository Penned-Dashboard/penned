import Link from "next/link";
import type { ReactNode } from "react";
import { PennedLogo } from "@/components/penned-logo";

/** Minimal chrome for public legal pages — no in-app marketing / staging home. */
export function LegalPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-900">
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <a
            className="flex min-w-0 items-center gap-3"
            href="https://www.penned.io"
            rel="noreferrer"
          >
            <PennedLogo compact />
            <p className="truncate text-xs text-slate-500">penned.io</p>
          </a>
          <div className="flex items-center gap-3">
            <Link className="button-secondary" href="/sign-in" prefetch={false}>
              Log in
            </Link>
            <Link className="button-primary" href="/sign-up" prefetch={false}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
