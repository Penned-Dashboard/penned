import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getInvoices } from "@/lib/orders";

export default async function ClientInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; page?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const invoices = await getInvoices(user.profileId);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;
  const filtered = params.month
    ? invoices.filter((invoice) => invoice.date.toLowerCase().includes(params.month!.toLowerCase()))
    : invoices;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardShell
      role="client"
      title="Invoices"
      description=""
      ctaLabel="← Back to Billing"
      ctaHref="/client/billing"
      currentPath="/client/billing"
      userName={user.fullName}
    >
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <form className="mb-5 flex flex-wrap gap-3" method="get">
          <input className="dashboard-input max-w-xs" defaultValue={params.month} name="month" type="month" />
          <button className="button-secondary" type="submit">
            Filter by month
          </button>
        </form>

        {rows.length ? (
          <div className="space-y-3">
            {rows.map((invoice) => {
              const isReceipt = /rcp|receipt/i.test(invoice.id) || /receipt/i.test(invoice.status);
              return (
                <div key={invoice.id} className="dashboard-list-row">
                  <div>
                    <p className="font-semibold text-slate-950">{invoice.id}</p>
                    <p className="text-sm text-slate-500">
                      {invoice.date} · {isReceipt ? "Receipt" : "Invoice"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-700">{invoice.amount}</p>
                    <a
                      className="button-secondary"
                      download={`${invoice.id}.txt`}
                      href={`data:text/plain,${encodeURIComponent(
                        `${isReceipt ? "Receipt" : "Invoice"} ${invoice.id}\n${invoice.date}\n${invoice.amount}\n${invoice.status}`,
                      )}`}
                    >
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link className="button-secondary" href={`/client/billing/invoices?page=${page - 1}`}>
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link className="button-secondary" href={`/client/billing/invoices?page=${page + 1}`}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
