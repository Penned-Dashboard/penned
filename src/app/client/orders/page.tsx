import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientOrders } from "@/lib/orders";

export default async function ClientOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const view = params.view === "completed" ? "completed" : "all";
  const orders = await getClientOrders(user.profileId);
  const filtered = orders.filter((order) => {
    const matchesView = view === "completed" ? order.status === "Accepted" : true;
    const matchesQuery = !query
      ? true
      : `${order.clientLabel} ${order.name} ${order.contentType} ${order.writer} ${order.status}`
          .toLowerCase()
          .includes(query);
    return matchesView && matchesQuery;
  });

  return (
    <DashboardShell
      role="client"
      title="Order Archive"
      description="Browse every order in your agency workspace, including completed work for later download or reference."
      ctaLabel="Create New Order"
      ctaHref="/client/new-order"
      currentPath="/client/orders"
      userName={user.fullName}
      searchQuery={params.q}
      tabs={[
        { label: "All orders", href: "/client/orders", active: view === "all" },
        { label: "Completed orders", href: "/client/orders?view=completed", active: view === "completed" },
      ]}
    >
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        {filtered.length ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
            <div className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
              <p>Order</p><p>Client</p><p>Type</p><p>Writer</p><p>Status</p><p>Date</p><p></p>
            </div>
            {filtered.map((order) => (
              <div key={order.id} className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] items-center border-t border-slate-200 px-4 py-4 text-sm text-slate-700">
                <div>
                  <Link className="font-semibold text-slate-950" href={`/client/orders/${order.id}`}>
                    {order.name}
                  </Link>
                  <p className="text-xs text-slate-400">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <p>{order.clientLabel}</p>
                <p>{order.contentType}</p>
                <p>{order.writer}</p>
                <p>{order.status}</p>
                <p>{order.deadline}</p>
                <Link className="text-right text-lg text-slate-400" href={`/client/orders/${order.id}`}>○</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
            <p className="font-semibold text-slate-900">No orders found</p>
            <p className="mt-2">Try another filter or create a new order.</p>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
