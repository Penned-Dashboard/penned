import Link from "next/link";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/account-manager";

const ACCOUNT_MANAGER = DEFAULT_ACCOUNT_MANAGER;

export function AccountManagerCard({
  variant = "card",
}: {
  variant?: "card" | "inline" | "quiet";
}) {
  if (variant === "inline") {
    return (
      <p className="text-sm leading-6 text-slate-600">
        Questions? Ask{" "}
        <Link className="font-semibold text-[var(--penned-navy)] underline" href="/client/help">
          {ACCOUNT_MANAGER.firstName}
        </Link>
        .
      </p>
    );
  }

  if (variant === "quiet") {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-6 text-slate-600">
          Not sure which option is right? Ask{" "}
          <Link className="font-semibold underline" href="/client/help">
            {ACCOUNT_MANAGER.firstName}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account manager</p>
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{ACCOUNT_MANAGER.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Honest advice on writing levels, delivery and billing — no sales pitch.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a className="button-primary" href={ACCOUNT_MANAGER.messageUrl} rel="noreferrer" target="_blank">
          Message
        </a>
        <Link className="button-secondary" href="/client/help?topic=priority">
          Priority Account
        </Link>
      </div>
    </div>
  );
}
