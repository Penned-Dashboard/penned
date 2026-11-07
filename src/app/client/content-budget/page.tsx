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
      title="Content budget"
      description=""
      ctaLabel="Top up"
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
          title="Balance"
          description="Orders are paid from this balance. Top up any time."
        >
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Balance</p>
            <h2 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
              {snapshot.remainingLabel}
            </h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric
              label="Your pre-pay credit"
              value={snapshot.currentTier.discount ? `${snapshot.currentTier.discount}% extra` : "No extra credit yet"}
              hint={snapshot.currentTier.name}
            />
            <Metric
              label="Saved so far"
              value={`$${snapshot.totalSaved.toFixed(2)}`}
              hint="Extra credit from your pre-payments."
            />
            <Metric
              label="Time left"
              value={
                snapshot.weeksRemaining
                  ? `${snapshot.weeksRemaining} weeks left`
                  : "Not enough order history yet"
              }
              hint="At the rate you're ordering now."
            />
          </div>
          <div className="mt-5">
            <Link className="button-primary" href="/client/content-budget/top-up">
              Top up
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
        title="Recent activity"
        description="History of top-ups, credits and order deductions."
      >
        <div className="space-y-3">
          {snapshot.recentActivity.length ? (
            snapshot.recentActivity.map((item) => (
              <div key={`${item.label}-${item.note}`} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.note}</p>
                </div>
                <p className="text-sm font-medium text-slate-700">{item.value}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No top-ups or deductions yet.</p>
          )}
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
