import Link from "next/link";
import { AccountManagerCard } from "@/components/account-manager-card";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ContentBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; checkout?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const [orders, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const snapshot = getContentBudgetSnapshot(orders, invoices);

  return (
    <DashboardShell
      role="client"
      title="Content Budget"
      description="Track prepaid balance, savings, and spend without plan-style dashboard language."
      ctaLabel="Top up content budget"
      ctaHref="/client/content-budget/top-up"
      currentPath="/client/content-budget"
      userName={user.fullName}
    >
      {params.setup === "stripe-missing" ? (
        <Alert tone="warning">
          Stripe is connected, but the price IDs are still missing. Add `STRIPE_BASIC_PRICE_ID` and
          `STRIPE_PRO_PRICE_ID` before enabling live checkout links.
        </Alert>
      ) : null}
      {params.checkout === "cancelled" ? (
        <Alert tone="neutral">Checkout was cancelled. You can restart the top-up whenever you are ready.</Alert>
      ) : null}
      {params.checkout === "success" ? (
        <Alert tone="success">Checkout completed. Stripe will update billing records after the webhook is configured.</Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Remaining balance"
          description="The most important number for content operations is how much working budget is left."
        >
          <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.09),rgba(43,182,168,0.12))] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Content budget</p>
            <h2 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
              {snapshot.remainingLabel}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Flexible agency billing with prepaid budgets, monthly account limits, and fast bulk ordering.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric
              label="Current discount tier"
              value={`Saving ${snapshot.currentTier.discount}%`}
              hint={`${snapshot.currentTier.name} tier`}
            />
            <Metric
              label="Total saved to date"
              value={`$${snapshot.totalSaved.toFixed(2)}`}
              hint="You’ve saved this so far on this balance."
            />
            <Metric
              label="Burn rate estimate"
              value={`${snapshot.weeksRemaining} weeks left`}
              hint="At your current order rate, your balance covers approximately 4 more weeks."
            />
          </div>
          <div className="mt-5">
            <Link className="button-primary" href="/client/content-budget/top-up">
              Top up content budget
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Account manager"
          description="Keep budget conversations tied to a real person when agencies need support."
        >
          <AccountManagerCard />
        </SectionCard>
      </section>

      <SectionCard
        title="Recent budget activity"
        description="Top-ups, deductions, refunds, and invoice-linked charges should be easy to scan."
      >
        <div className="space-y-3">
          {snapshot.recentActivity.map((item) => (
            <div key={`${item.label}-${item.note}`} className="dashboard-list-row">
              <div>
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="text-sm text-slate-500">{item.note}</p>
              </div>
              <p className="text-sm font-medium text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}

function Alert({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warning" | "neutral" | "success";
}) {
  const styles =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return <div className={`rounded-[1.25rem] border px-5 py-4 text-sm ${styles}`}>{children}</div>;
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </div>
  );
}
