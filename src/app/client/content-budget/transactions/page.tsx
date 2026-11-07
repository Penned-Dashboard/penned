import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ContentBudgetTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; month?: string; page?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const [orders, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const snapshot = getContentBudgetSnapshot(orders, invoices);
  const query = params.q?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;

  const filtered = snapshot.recentActivity.filter((item) => {
    if (!query) return true;
    return `${item.label} ${item.note} ${item.value}`.toLowerCase().includes(query);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardShell
      role="client"
      title="Transactions"
      description=""
      ctaLabel="← Back to Content budget"
      ctaHref="/client/content-budget"
      currentPath="/client/content-budget"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/client/content-budget/transactions"
    >
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <form className="mb-5 flex flex-wrap gap-3" method="get">
          <input
            className="dashboard-input max-w-xs"
            defaultValue={params.month}
            name="month"
            placeholder="Month (YYYY-MM)"
            type="month"
          />
          <button className="button-secondary" type="submit">
            Filter
          </button>
        </form>

        {rows.length ? (
          <div className="space-y-3">
            {rows.map((item) => (
              <div key={`${item.label}-${item.note}-${item.value}`} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.note}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    item.value.startsWith("+")
                      ? "text-emerald-700"
                      : item.value.startsWith("-")
                        ? "text-rose-700"
                        : "text-slate-700"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No transactions match these filters.</p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                className="button-secondary"
                href={`/client/content-budget/transactions?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                className="button-secondary"
                href={`/client/content-budget/transactions?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
