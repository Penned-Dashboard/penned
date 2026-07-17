import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientOrders } from "@/lib/orders";

export default async function ClientFoldersPage() {
  const user = await requireRole("client");
  const orders = await getClientOrders(user.profileId);
  const folders = Array.from(new Map(orders.map((order) => [order.clientLabel, order])).values());

  return (
    <DashboardShell
      role="client"
      title="Client Folders"
      description="Organize recurring end-client context so briefs, preferences, and completed work stay easy to find."
      ctaLabel="Create New Order"
      ctaHref="/client/new-order"
      currentPath="/client/folders"
      userName={user.fullName}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {folders.length ? (
          folders.map((folder) => {
            const total = orders.filter((order) => order.clientLabel === folder.clientLabel).length;
            const completed = orders.filter((order) => order.clientLabel === folder.clientLabel && order.status === "Accepted").length;
            return (
              <article key={folder.clientLabel} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Client folder</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{folder.clientLabel}</h2>
                <dl className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><dt>Total orders</dt><dd className="font-medium text-slate-900">{total}</dd></div>
                  <div className="flex items-center justify-between"><dt>Completed</dt><dd className="font-medium text-slate-900">{completed}</dd></div>
                  <div className="flex items-center justify-between"><dt>Latest workflow</dt><dd className="font-medium text-slate-900">{folder.status}</dd></div>
                </dl>
                <div className="mt-5 rounded-[1rem] bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  Use this folder as the shared home for brand notes, tone guidance, compliance rules, and reusable briefs for this end client.
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500 md:col-span-2 xl:col-span-3">
            <p className="font-semibold text-slate-900">No client folders yet</p>
            <p className="mt-2">Orders with a client label will automatically make this workspace useful for agencies managing multiple brands.</p>
            <Link className="mt-4 inline-flex button-primary" href="/client/new-order">Create your first labeled order</Link>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
