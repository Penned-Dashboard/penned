import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import {
  getClientOrders,
  getClientReviewQueue,
  getInvoices,
} from "@/lib/orders";

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const [liveOrders, reviewQueue, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getClientReviewQueue(user.profileId),
    getInvoices(user.profileId),
  ]);
  const activeOrders = filterByQuery(
    liveOrders,
    query,
    (order) => `${order.name} ${order.contentType} ${order.writer} ${order.status}`,
  );
  const filteredReviewQueue = filterByQuery(
    reviewQueue,
    query,
    (item) => `${item.title} ${item.writer} ${item.status}`,
  );
  const metrics = [
    {
      label: "Active orders",
      value: String(activeOrders.length),
      hint: "Live content requests currently attached to your workspace.",
    },
    {
      label: "In review",
      value: String(reviewQueue.length),
      hint: "Submissions that need your review or revision feedback.",
    },
    {
      label: "Completed",
      value: String(activeOrders.filter((order) => order.status === "accepted").length),
      hint: "Orders that have already been approved and completed.",
    },
    {
      label: "Plan",
      value: invoices[0]?.amount ?? "Basic",
      hint: "Subscription state pulled from your billing records.",
    },
  ];

  return (
    <DashboardShell
      role="client"
      title="Client Dashboard"
      description="Create content orders, review drafts, and manage your publishing workflow from one place."
      ctaLabel="Create New Order"
      ctaHref="/client/new-order"
      currentPath="/client"
      userName={user.fullName}
      searchQuery={params.q}
      tabs={[
        { label: "Overview", href: "/client", active: true },
        { label: "Orders", href: "/client#orders", active: false },
        { label: "Reviews", href: "/client#review-queue", active: false },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`rounded-[1.5rem] border p-5 ${
              index === 0
                ? "border-blue-200 bg-blue-50"
                : index === 1
                  ? "border-orange-200 bg-orange-50"
                  : index === 2
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
              {metric.value}
            </h2>
            <p className="mt-3 text-sm text-emerald-500">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] p-8 text-white">
          <h2 className="text-4xl font-semibold tracking-[-0.04em]">
            Ready to create something great?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Submit a content brief and get matched with expert writers.
          </p>
          <Link className="mt-8 inline-flex rounded-2xl bg-[linear-gradient(135deg,#ff8c1a_0%,#ef4444_100%)] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_34px_rgba(239,68,68,0.25)]" href="/client/new-order">
            + Create New Order
          </Link>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Current Plan</p>
              <h3 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
                $299<span className="text-2xl text-slate-400">/mo</span>
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Pro
            </span>
          </div>
          <p className="mt-4 text-base text-slate-500">
            Preferred writers • Slack support
          </p>
          <div className="mt-6 h-2 rounded-full bg-slate-100">
            <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
          </div>
          <p className="mt-3 text-sm text-slate-400">18 of 24 orders used this cycle</p>
        </div>
      </section>

      <section id="orders" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Recent Orders
          </h2>
          <Link className="text-base font-medium text-slate-600" href="/client">
            View all →
          </Link>
        </div>
        {activeOrders.length ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
            <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr_48px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
              <p>Order</p>
              <p>Type</p>
              <p>Writer</p>
              <p>Status</p>
              <p>Date</p>
              <p></p>
            </div>
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr_48px] items-center border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
              >
                <div>
                  <Link className="font-semibold text-slate-950" href={`/client/orders/${order.id}`}>
                    {order.name}
                  </Link>
                  <p className="text-xs text-slate-400">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <p>{order.contentType}</p>
                <p>{order.writer}</p>
                <p>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                    {order.status}
                  </span>
                </p>
                <p>{order.deadline}</p>
                <Link className="text-right text-lg text-slate-400" href={`/client/orders/${order.id}`}>
                  ○
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent orders yet"
            body="Create your first order to see it appear here."
          />
        )}
      </section>

      <section
        id="review-queue"
        className="rounded-[1.75rem] border border-slate-200 bg-white p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Review Queue
          </h2>
          <Link className="text-base font-medium text-slate-600" href="/client#review-queue">
            Refresh
          </Link>
        </div>
        {filteredReviewQueue.length ? (
          <div className="space-y-3">
            {filteredReviewQueue.map((item) => (
              <div key={item.submissionId} className="dashboard-list-row">
                <div>
                  <Link
                    className="font-semibold text-slate-950"
                    href={`/client/orders/${item.orderId}`}
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-slate-500">Writer: {item.writer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{item.status}</p>
                  <p className="text-xs text-slate-500">{item.due}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No review items match this search" : "No items in review"}
            body={
              query
                ? "Try a different search term or clear the workspace search."
                : "Draft reviews and revision requests will show up here."
            }
          />
        )}
      </section>
    </DashboardShell>
  );
}

function filterByQuery<T>(items: T[], query: string, readText: (item: T) => string) {
  if (!query) {
    return items;
  }

  return items.filter((item) => readText(item).toLowerCase().includes(query));
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}
