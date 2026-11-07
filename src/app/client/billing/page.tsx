import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { accountManagerForClient } from "@/lib/account-manager";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ClientBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; setup?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const [orders, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const snapshot = getContentBudgetSnapshot(orders, invoices);
  const manager = accountManagerForClient(user.profileId);
  const docs = invoices.slice(0, 5);

  return (
    <DashboardShell
      role="client"
      title="Billing"
      description=""
      currentPath="/client/billing"
      userName={user.fullName}
    >
      {params.checkout === "success" ? (
        <Alert tone="success">Payment details updated. Stripe will sync the card on file shortly.</Alert>
      ) : null}
      {params.setup === "stripe-missing" ? (
        <Alert tone="warning">Stripe customer portal is not configured in this environment yet.</Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Invoices and receipts" description="Download paid invoices and top-up receipts.">
          <div className="space-y-3">
            {docs.length ? (
              docs.map((invoice) => {
                const isReceipt = /rcp|receipt/i.test(invoice.id) || /receipt/i.test(invoice.status);
                return (
                  <div key={invoice.id} className="dashboard-list-row">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{invoice.id}</p>
                      <p className="text-sm text-slate-500">
                        {invoice.date} · {isReceipt ? "Receipt" : "Invoice"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{invoice.amount}</p>
                        <p className="text-xs text-slate-500">{invoice.status}</p>
                      </div>
                      <a
                        className="button-secondary"
                        href={`data:text/plain,${encodeURIComponent(
                          `${isReceipt ? "Receipt" : "Invoice"} ${invoice.id}\nDate: ${invoice.date}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}\n`,
                        )}`}
                        download={`${invoice.id}.txt`}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No invoices or receipts yet.</p>
            )}
          </div>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[var(--penned-navy)] underline" href="/client/billing/invoices">
            See all →
          </Link>
        </SectionCard>

        <SectionCard title="Payment method" description="Card and billing contact for top-ups and invoices.">
          <div className="space-y-3">
            <PreferenceRow label="Card on file" value="Visa ending 4242" />
            <label className="block rounded-[1rem] border border-slate-200 bg-white p-4">
              <span className="text-sm font-medium text-slate-700">Billing contact</span>
              <input className="dashboard-input mt-2" defaultValue={user.email} name="billingContact" />
            </label>
            <PreferenceRow label="Account owner" value={user.fullName} />
          </div>
          <a className="button-primary mt-5 inline-flex" href="/api/stripe/portal">
            Update card
          </a>
        </SectionCard>
      </section>

      <SectionCard title="Payment terms" description="Standard accounts prepay. Priority Account is for approved agencies.">
        <PriorityAccountCard notEligible={snapshot.notEligible} state={snapshot.priorityState} />
        <p className="mt-5 text-sm text-slate-600">
          Questions? Ask{" "}
          <Link className="font-semibold underline" href="/client/help?topic=priority">
            {manager.firstName}
          </Link>
          .
        </p>
      </SectionCard>
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
    ? "Standard payment terms apply. Prepayment is required before orders are placed. Established Managed agencies may qualify for monthly billing."
    : state === "Active"
      ? "Priority Account is active. You can place orders without prepaying. Invoices are issued monthly and due within 14 days."
      : "You may be eligible for Priority Account status — order now and pay after delivery. Ask your account manager.";

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority Account</p>
      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{state}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="shrink-0 font-medium text-slate-700">{label}</p>
      <p className="min-w-0 break-all text-right text-slate-500">{value}</p>
    </div>
  );
}

function Alert({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warning" | "success";
}) {
  const styles =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`rounded-[1.25rem] border px-5 py-4 text-sm ${styles}`}>{children}</div>;
}
