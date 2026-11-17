import { AssignOrderForm } from "@/components/assign-order-form";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { formatUsdFromCents } from "@/lib/pricing";
import { getTeamEditors, getTeamOrders, getTeamWriters, WRITER_ASSIGNABLE } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; noticeMessage?: string }>;
}) {
  const user = await requireRole("account_manager");
  const notice = await searchParams;
  const [orders, writers, editors] = await Promise.all([
    getTeamOrders({ limit: 100 }),
    getTeamWriters(),
    getTeamEditors(),
  ]);
  const returnTo = `${rolePath("account_manager")}/orders`;

  return (
    <DashboardShell
      role="account_manager"
      title="Orders"
      description=""
      currentPath={`${rolePath("account_manager")}/orders`}
      userName={user.fullName}
    >
      {notice.noticeMessage ? (
        <p
          className={`rounded-[14px] px-4 py-3 text-sm ${
            notice.notice === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.noticeMessage}
        </p>
      ) : null}
      <SectionCard
        title="Your clients’ orders"
        description="Assign a writer once the brief is accepted. Writers and editors get an email when you assign them."
      >
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
                  <th className="px-3 py-2 font-medium">Writer and editor</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[var(--penned-navy)]">{order.title}</p>
                      <p className="text-xs text-slate-500">{order.contentType}</p>
                      {order.preferredWriter ? (
                        <p className="text-xs text-slate-500">Client prefers: {order.preferredWriter}</p>
                      ) : null}
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
                    <td className="px-3 py-3 align-top">
                      {order.workflowStatus === "completed" || order.workflowStatus === "cancelled" ? (
                        <span className="text-xs text-slate-500">Finished</span>
                      ) : (
                        <AssignOrderForm
                          canAssignWriter={WRITER_ASSIGNABLE.includes(order.workflowStatus)}
                          compact
                          currentEditorId={order.editorId}
                          currentWriterId={order.writerId}
                          editors={editors}
                          orderId={order.id}
                          returnTo={returnTo}
                          writerHint="Accept the brief first"
                          writers={writers}
                        />
                      )}
                    </td>
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
