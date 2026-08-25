"use client";

import { useMemo, useState } from "react";
import { AccountManagerCard } from "@/components/account-manager-card";
import { estimateArticles, getTierForAmount, topUpTiers } from "@/lib/content-budget";

export function ContentBudgetTopUp({
  priorityState,
}: {
  priorityState: string;
}) {
  const [amount, setAmount] = useState("");
  const parsed = Number(amount) || 0;
  const tier = getTierForAmount(parsed);
  const articles = estimateArticles(parsed);
  const isManaged = parsed >= 5000;
  const dueToday = parsed;
  const isPriorityActive = priorityState === "Active";

  const summary = useMemo(
    () => [
      { label: "Top-up amount", value: money(parsed) },
      { label: "Content budget added to your account", value: money(parsed) },
      {
        label: "Discount applied",
        value: tier.discount ? `${tier.discount}% Managed` : "None",
      },
      { label: "You pay today", value: money(dueToday) },
    ],
    [parsed, tier.discount, dueToday],
  );

  if (isPriorityActive) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Priority Account is active
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Your Priority Account means you can place orders without prepaying. Your next invoice
          will be issued at the end of the month.
        </p>
        <a className="button-primary mt-6" href="/client/new-order">
          Continue to order →
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Add to your content budget
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Top up your content budget at the standard rate, or prepay a larger Managed amount
          upfront to unlock a discount on every eligible order.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {topUpTiers.map((item) => {
            const selected = tier.id === item.id && parsed > 0;
            return (
              <button
                className={`rounded-[1.25rem] border p-5 text-left transition ${
                  selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
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
            placeholder="$0"
            value={amount}
          />
          <p className="mt-2 text-sm text-slate-500">
            {isManaged ? "Managed prepaid amount." : "Any amount. No minimum for standard top-ups."}
          </p>
        </label>

        <p className="mt-4 text-sm text-slate-600">
          Estimated articles at $0.05/word, 800 words: {articles} articles
        </p>

        {!isManaged ? (
          <div className="mt-4 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            This top-up will be added to your content budget at the standard pay-as-you-go rate.
            Prepay $5,000 or more to unlock a discount.
          </div>
        ) : null}

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Prefer to order now and pay after delivery? Priority Account agencies don’t need to
          prepay. Ask your account manager if you qualify.
        </p>
      </section>

      <section className="grid gap-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h3 className="text-2xl font-semibold text-slate-950">Order summary</h3>
          <div className="mt-4 space-y-3">
            {summary.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                <p className="text-slate-500">{item.label}</p>
                <p className="font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <a
            className="button-primary mt-6 w-full"
            href={parsed > 0 ? `/api/stripe/checkout?plan=basic&amount=${parsed}` : "#"}
          >
            Confirm and pay {money(dueToday)}
          </a>
        </div>

        <AccountManagerCard variant="quiet" />

        <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 md:grid-cols-2">
          <p>No expiry on your balance</p>
          <p>Discount applied to every eligible order</p>
          <p>Cancel remaining balance anytime</p>
          <p>Invoice issued on payment</p>
        </div>
      </section>
    </div>
  );
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
