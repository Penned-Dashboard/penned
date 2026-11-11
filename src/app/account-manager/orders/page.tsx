import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { formatUsdFromCents } from "@/lib/pricing";
import { getTeamOrders } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerOrdersPage() {
  const user = await requireRole("account_manager");
  const orders = await getTeamOrders({ limit: 100 });

  return (
    <DashboardShell
      role="account_manager"
      title="Orders"
      description=""
      currentPath={`${rolePath("account_manager")}/orders`}
      userName={user.fullName}
    >
      <SectionCard title="Your clients’ orders" description="">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Level</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <Link className="font-semibold text-[var(--penned-navy)] underline" href={`/admin/orders/${order.id}`}>
                        {order.title}
                      </Link>
                      <p className="text-xs text-slate-500">{order.contentType}</p>
                    </td>
                    <td className="px-3 py-3">{order.agencyName} · {order.clientLabel}</td>
                    <td className="px-3 py-3">{order.tier}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold">
                        {order.teamStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">{order.dueLabel}</td>
                    <td className="px-3 py-3">{formatUsdFromCents(order.priceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
