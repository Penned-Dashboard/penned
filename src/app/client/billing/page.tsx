import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ClientBillingPage({
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

  const approvedOrders = orders.filter((order) => order.status === "Accepted").length;
  const notEligible = approvedOrders < 3;
  const priorityState = notEligible ? "Not eligible" : invoices.length ? "Eligible, not activated" : "Eligible, not activated";
  const estimatedBudget = Math.max(6000 - orders.length * 275, 0);
  const totalSaved = approvedOrders * 42.5;
  const weeksRemaining = orders.length ? Math.max(Math.round(estimatedBudget / Math.max(orders.length * 90, 1)), 1) : 8;
  const topUpTiers = [
    {
      name: "Standard top-up",
      amount: "Any amount",
      discount: "No discount",
      detail: "Pay-as-you-go rate. No minimum amount. Add what you need, when you need it.",
    },
    {
      name: "$5,000–$9,999",
      amount: "Managed tier",
      discount: "5% off eligible Managed orders",
      detail: "Save up to $499 on this top-up.",
    },
    {
      name: "$10,000–$19,999",
      amount: "Managed tier",
      discount: "7.5% off eligible Managed orders",
      detail: "Save up to $1,500 on this top-up.",
    },
    {
      name: "$20,000+",
      amount: "Managed tier",
      discount: "10% off eligible Managed orders",
      detail: "Save $2,000+ on this top-up.",
    },
  ];
  const recentActivity = orders.slice(0, 5).map((order) => ({
    label: `${order.name} · ${order.clientLabel}`,
    value: order.status === "Accepted" ? "-$275 est." : "Reserved budget",
    note: order.deadline,
  }));

  return (
    <DashboardShell
      role="client"
      title="Content Budget"
      description="Track prepaid balance, invoice visibility, and payment terms without plan-style dashboard language."
      ctaLabel="Back to client dashboard"
      ctaHref="/client"
      currentPath="/client/billing"
      userName={user.fullName}
    >
      {params.setup === "stripe-missing" ? (
        <Alert tone="warning">
          Stripe is connected, but the price IDs are still missing. Add `STRIPE_BASIC_PRICE_ID` and
          `STRIPE_PRO_PRICE_ID` before enabling live checkout links.
        </Alert>
      ) : null}
      {params.checkout === "cancelled" ? (
        <Alert tone="neutral">
          Checkout was cancelled. You can restart the top-up or invoice flow whenever you are ready.
        </Alert>
      ) : null}
      {params.checkout === "success" ? (
        <Alert tone="success">
          Checkout completed. Stripe will update the billing records after the webhook is configured.
        </Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Remaining balance"
          description="The most important number for content operations is how much working budget is left."
        >
          <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.09),rgba(43,182,168,0.12))] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Content budget</p>
            <h2 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
              ${estimatedBudget.toLocaleString()} remaining
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Flexible agency billing with prepaid budgets, monthly account limits, and fast bulk ordering.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="Current discount tier" value={approvedOrders >= 6 ? "7.5% tier" : approvedOrders >= 3 ? "5% tier" : "Standard rate"} />
            <Metric label="Total saved to date" value={`$${totalSaved.toFixed(2)}`} />
            <Metric label="Burn rate estimate" value={`${weeksRemaining} weeks left`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="button-primary" href="/api/stripe/checkout?plan=basic">
              Top up content budget
            </a>
            <a className="button-secondary" href="mailto:hello@fipublishing.com?subject=Content%20budget%20help">
              Message account manager
            </a>
          </div>
        </SectionCard>

        <SectionCard
          title="Priority Account"
          description="Trusted monthly billing is only available to approved agencies."
        >
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{priorityState}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {notEligible
                ? "Standard payment terms apply to your account. Prepayment is required before orders are placed. Established Managed agencies may qualify for monthly billing once they pass the early trust thresholds."
                : "You may be eligible for Priority Account status — monthly billing terms that let you order now and pay after delivery. Request it from your account manager and we’ll review the account."}
            </p>
            <a
              className="mt-4 inline-flex text-sm font-semibold text-blue-700"
              href="mailto:hello@fipublishing.com?subject=Priority%20Account%20status&body=I%E2%80%99d%20like%20to%20find%20out%20if%20I%20qualify%20for%20Priority%20Account%20terms."
            >
              Ask about Priority Account status →
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Metric label="Monthly billing limit" value={notEligible ? "Not active" : "$3,000"} />
            <Metric label="Next invoice date" value={notEligible ? "N/A" : "End of month"} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Top-up options"
          description="Standard top-ups stay flexible. Managed tiers unlock discounts on eligible orders."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {topUpTiers.map((tier) => (
              <article key={tier.name} className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{tier.name}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{tier.discount}</h3>
                <p className="mt-2 text-sm text-slate-500">{tier.amount}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{tier.detail}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent budget activity"
          description="Top-ups, deductions, and invoice-linked budget movements should be easy to scan."
        >
          {recentActivity.length ? (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={`${item.label}-${item.note}`} className="dashboard-list-row">
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.note}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
              Once orders and top-ups start moving, budget activity will appear here.
            </div>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Invoice access"
          description="Clients should be able to download invoices, receipts, and statements from one place."
        >
          {invoices.length ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="dashboard-list-row">
                  <div>
                    <p className="font-semibold text-slate-950">{invoice.id}</p>
                    <p className="text-sm text-slate-500">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{invoice.amount}</p>
                    <p className="text-xs text-slate-500">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
              No invoice records yet. Stripe-linked invoices, monthly statements, and receipts will appear here
              once billing events are live.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Account manager"
          description="Keep the payment conversation tied to a real person when agencies need support."
        >
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Your account manager</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Sarah K.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Not sure which option is right? Your account manager can help — honest advice, no pitch.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="button-secondary" href="mailto:hello@fipublishing.com?subject=Billing%20support">
                Message Sarah
              </a>
              <a
                className="button-primary"
                href="mailto:hello@fipublishing.com?subject=Priority%20Account%20terms&body=I%E2%80%99d%20like%20to%20find%20out%20if%20I%20qualify%20for%20Priority%20Account%20terms."
              >
                Ask about Priority Account
              </a>
            </div>
          </div>
        </SectionCard>
      </section>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
