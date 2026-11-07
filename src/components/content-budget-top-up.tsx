"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { estimateArticles, getTierForAmount, topUpTiers } from "@/lib/content-budget";
import { nextVolumeTierNudge, volumeDiscountCreditCents } from "@/lib/pricing";

export function ContentBudgetTopUp({
  priorityState,
}: {
  priorityState: string;
}) {
  const [amount, setAmount] = useState("");
  const parsed = Number(amount) || 0;
  const cents = Math.round(parsed * 100);
  const tier = getTierForAmount(parsed);
  const creditCents = volumeDiscountCreditCents(cents);
  const credited = (cents + creditCents) / 100;
  const articles = estimateArticles(credited);
  const isManaged = parsed >= 5000;
  const nudge = nextVolumeTierNudge(cents);
  const isPriorityActive = priorityState === "Active";

  const summary = useMemo(
    () => [
      { label: "Top-up amount", value: money(parsed) },
      {
        label: creditCents ? `Pre-pay credit (${tier.discount}%)` : "Pre-pay credit",
        value: creditCents ? money(creditCents / 100) : "$0.00",
      },
      { label: "Added to your balance", value: money(credited) },
      { label: "You pay today", value: money(parsed) },
    ],
    [parsed, creditCents, credited, tier.discount],
  );

  if (isPriorityActive) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Priority Account is active
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          You can place orders without prepaying. Your next invoice will be issued at the end of the month.
        </p>
        <Link className="button-primary mt-6 inline-flex" href="/client/new-order">
          Continue to order
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Top up</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Add to your prepaid budget. From $5,000 we add extra credit automatically.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {topUpTiers.map((item) => {
            const selected = tier.id === item.id && parsed > 0;
            return (
              <button
                className={`rounded-[1.25rem] border p-5 text-left transition ${
                  selected ? "border-[#91B9D2] bg-[#F3F8FB]" : "border-slate-200 bg-white"
                }`}
                key={item.id}
                onClick={() => setAmount(String(item.min || 500))}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.name}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{item.discountLabel}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
              </button>
            );
          })}
        </div>

        <label className="mt-6 block">
          <span className="dashboard-label">How much would you like to add?</span>
          <input
            className="dashboard-input"
            inputMode="decimal"
            min={0}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="5000"
            value={amount}
          />
        </label>

        {nudge ? (
          <p className="mt-3 text-sm font-medium text-[var(--penned-navy)]">{nudge.message}.</p>
        ) : null}

        <p className="mt-4 text-sm text-slate-600">
          Roughly {articles} Standard articles at 1,000 words once this credit is on your balance.
        </p>

        {!isManaged ? (
          <div className="mt-4 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            Prepay $5,000 or more to unlock extra credit on this top-up.
          </div>
        ) : null}

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Prefer to order now and pay after delivery?{" "}
          <Link className="font-semibold underline" href="/client/help?topic=priority">
            Ask about Priority Account status
          </Link>
          .
        </p>
      </section>

      <section className="grid gap-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h3 className="text-2xl font-semibold text-slate-950">Payment summary</h3>
          <div className="mt-4 space-y-3">
            {summary.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                <p className="text-slate-500">{item.label}</p>
                <p className="font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <a
            className={`button-primary mt-6 w-full ${parsed > 0 ? "" : "pointer-events-none opacity-50"}`}
            href={parsed > 0 ? `/api/stripe/checkout?amount=${parsed}` : "#"}
          >
            Confirm and pay {money(parsed)}
          </a>
        </div>
      </section>
    </div>
  );
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
