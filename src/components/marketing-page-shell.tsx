import Link from "next/link";
import type { ReactNode } from "react";
import { AppAuthBar } from "@/components/app-auth-bar";

export function MarketingPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-900">
      <AppAuthBar />
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_15%_20%,rgba(255,210,182,0.35),transparent_18%),radial-gradient(circle_at_75%_18%,rgba(131,216,255,0.22),transparent_24%),radial-gradient(circle_at_85%_40%,rgba(81,187,176,0.14),transparent_20%),linear-gradient(180deg,#f6f8fc_0%,#eef3f8_100%)]" />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:px-10">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-10 shadow-[0_24px_70px_rgba(25,38,63,0.07)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-500">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-500">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary" href="/sign-up?role=client">
              Start Ordering
            </Link>
            <Link className="button-secondary" href="/sign-up?role=writer">
              Join as Writer
            </Link>
          </div>
        </div>
        <div className="mt-10">{children}</div>
      </section>
    </main>
  );
}
