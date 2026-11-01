import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getAdminOrderQueue } from "@/lib/orders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; client?: string; type?: string; status?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const orders = await getAdminOrderQueue();

  const clients = [...new Set(orders.map((order) => order.clientLabel))].sort((a, b) => a.localeCompare(b));
  const types = [...new Set(orders.map((order) => order.contentType))].sort((a, b) => a.localeCompare(b));
  const statuses = [...new Set(orders.map((order) => order.statusKey))].sort((a, b) => a.localeCompare(b));

  const filtered = orders.filter((order) => {
    if (params.client && order.clientLabel !== params.client) return false;
    if (params.type && order.contentType !== params.type) return false;
    if (params.status && order.statusKey !== params.status) return false;
    if (
      query &&
      !`${order.title} ${order.clientLabel} ${order.contentType} ${order.writer} ${order.state}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });

  return (
    <DashboardShell
      role="admin"
      title="All Orders"
      description="Browse every order, filter by client or content type, and open an order to refund or review."
      ctaLabel="Back to dashboard"
      ctaHref="/admin"
      currentPath="/admin/orders"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/admin/orders"
    >
      <SectionCard title="Filters" description={`${filtered.length} of ${orders.length} orders shown.`}>
        <form action="/admin/orders" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="get">
          <label>
            <span className="dashboard-label">Search</span>
            <input className="dashboard-input" defaultValue={params.q} name="q" placeholder="Title, client, writer" />
          </label>
          <label>
            <span className="dashboard-label">Client</span>
            <select className="dashboard-input" defaultValue={params.client ?? ""} name="client">
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="dashboard-label">Content type</span>
            <select className="dashboard-input" defaultValue={params.type ?? ""} name="type">
              <option value="">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="dashboard-label">Status</span>
            <select className="dashboard-input" defaultValue={params.status ?? ""} name="status">
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button className="button-primary" type="submit">
              Apply
            </button>
            <Link className="button-secondary" href="/admin/orders">
              Reset
            </Link>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Orders" description="Open an order for detail, refund, or writer assignment review.">
        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((order) => (
              <Link key={order.id} className="dashboard-list-row" href={`/admin/orders/${order.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950">{order.title}</p>
                  <p className="text-sm text-slate-500">
                    {order.clientLabel} · {order.contentType} · {order.writer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{order.state}</p>
                  <p className="text-xs text-slate-500">
                    {order.budget} · {order.deadline}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-[1.25rem] border border-dashed border-slate-200 px-5 py-6 text-sm text-slate-500">
              No orders match these filters.
            </p>
          )}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
