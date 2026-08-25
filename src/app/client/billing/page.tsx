import { AccountManagerCard } from "@/components/account-manager-card";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ClientBillingPage() {
  const user = await requireRole("client");
  const [orders, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const snapshot = getContentBudgetSnapshot(orders, invoices);
  const demoInvoices = invoices.length
    ? invoices
    : [
        { id: "INV-2041", date: "Jul 31, 2026", amount: "$1,250.00", status: "Paid" },
        { id: "INV-2038", date: "Jun 30, 2026", amount: "$980.00", status: "Paid" },
        { id: "RCP-1184", date: "Jun 12, 2026", amount: "$5,000.00", status: "Receipt" },
      ];

  return (
    <DashboardShell
      role="client"
      title="Billing"
      description="Payment history, invoices, payment methods, and Priority Account terms live here — separate from content budget."
      ctaLabel="View content budget"
      ctaHref="/client/content-budget"
      currentPath="/client/billing"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Invoice access"
          description="Download individual invoices, monthly statements, payment receipts, and VAT/tax records."
        >
          <div className="space-y-3">
            {demoInvoices.map((invoice) => (
              <div key={invoice.id} className="dashboard-list-row">
                <div className="min-w-0">
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
        </SectionCard>

        <SectionCard
          title="Payment method"
          description="Card details and billing contact information used for top-ups and invoice collection."
        >
          <div className="space-y-3">
            <PreferenceRow label="Card on file" value="Visa ending 4242" />
            <PreferenceRow label="Billing contact" value={user.email} wrap />
            <PreferenceRow label="VAT / tax records" value="Available with invoice exports" />
            <PreferenceRow label="Account owner" value={user.fullName} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Payment terms"
          description="Standard accounts prepay. Priority Account is only available to approved trusted agencies."
        >
          <PriorityAccountCard
            notEligible={snapshot.notEligible}
            state={snapshot.priorityState}
          />
          {!snapshot.notEligible ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Metric label="Monthly billing limit" value="$3,000" />
              <Metric label="Used this month" value="$2,250" />
              <Metric label="Remaining available" value="$750" />
              <Metric label="Next invoice date" value="End of month" />
              <Metric label="Payment due" value="14 days after invoice date" />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Account manager"
          description="Ask about Priority Account status or invoice terms without leaving billing."
        >
          <AccountManagerCard />
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function PriorityAccountCard({
  state,
  notEligible,
}: {
  state: string;
  notEligible: boolean;
}) {
  const copy = notEligible
    ? "Standard payment terms apply to your account. Prepayment is required before orders are placed. Established Managed agencies may qualify for monthly billing — ask your account manager if you’d like to be considered."
    : state === "Active"
      ? "Priority Account is active on your account. You can place orders without prepaying. Invoices are issued on the 1st of each month for all orders placed in the previous period. Payment is due within 14 days of the invoice date."
      : "You may be eligible for Priority Account status — monthly billing terms that let you order now and pay after delivery. Request it from your account manager and we’ll review your account.";

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority Account</p>
      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{state}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="shrink-0 font-medium text-slate-700">{label}</p>
      <p className={`min-w-0 text-right text-slate-500 ${wrap ? "break-all" : ""}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
