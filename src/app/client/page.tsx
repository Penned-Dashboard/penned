import Link from "next/link";
import { loadSampleClientOrdersAction } from "@/app/client/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceAutoRefresh } from "@/components/workspace-auto-refresh";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientFolders, getClientOrders, getClientReviewQueue, getInvoices } from "@/lib/orders";

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sampleState?: string; sampleMessage?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const sampleState =
    params.sampleState === "error"
      ? "error"
      : params.sampleState === "success"
        ? "success"
        : null;
  const sampleMessage = params.sampleMessage?.trim() ?? "";

  const [liveOrders, reviewQueue, invoices, folders] = await Promise.all([
    getClientOrders(user.profileId),
    getClientReviewQueue(user.profileId),
    getInvoices(user.profileId),
    getClientFolders(user.profileId),
  ]);

  const workspaceTitle = `Welcome back, ${user.fullName.split(" ")[0] || user.fullName}`;
  const allOrders = filterByQuery(
    liveOrders,
    query,
    (order) => `${order.clientLabel} ${order.name} ${order.contentType} ${order.writer} ${order.status}`,
  );
  const recentOrders = allOrders.slice(0, 6);
  const completedOrders = allOrders.filter((order) =>
    ["Accepted", "Approved", "Completed"].includes(order.status),
  );
  // Only real folders — never invent counts from order client labels.
  const clientFolders = folders.map((folder) => folder.name);
  const filteredReviewQueue = filterByQuery(
    reviewQueue,
    query,
    (item) => `${item.clientLabel} ${item.title} ${item.writer} ${item.status}`,
  );

  const budget = getContentBudgetSnapshot(liveOrders, invoices);
  const estimatedRemaining = budget.remaining;

  const metrics = [
    {
      label: "Active orders",
      value: String(allOrders.filter((order) => !["Accepted", "Approved", "Completed"].includes(order.status)).length),
      hint: "Being written now.",
      href: "/client/orders?view=in-progress",
    },
    {
      label: "In review",
      value: String(reviewQueue.length),
      hint: "Drafts waiting for your feedback.",
      href: "/client/orders?view=in-review",
    },
    {
      label: "Completed orders",
      value: String(completedOrders.length),
      hint: "Approved and ready to download.",
      href: "/client/orders?view=completed",
    },
    {
      label: "Content budget",
      value: `$${estimatedRemaining.toLocaleString()}`,
      hint: "Left in your prepaid budget.",
      href: "/client/content-budget",
    },
  ];
  const showSampleLoader = process.env.NODE_ENV !== "production" || Boolean(user.canSwitchRoles);

  return (
    <DashboardShell
      role="client"
      title={workspaceTitle}
      description=""
      ctaLabel="New order"
      ctaHref="/client/new-order"
      currentPath="/client"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/client"
    >
      <WorkspaceAutoRefresh />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 ${
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
            <p className="mt-3 text-sm text-slate-500">{metric.hint}</p>
          </Link>
        ))}
      </section>

      {showSampleLoader ? (
        <section className={`rounded-[1.5rem] border px-5 py-4 ${
          sampleState === "error"
            ? "border-rose-200 bg-rose-50"
            : sampleState === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Demo only
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Load sample orders for stakeholder review
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Add one completed order and one in-review order so the dashboard has realistic data.
              </p>
              {sampleMessage ? (
                <p className={`mt-3 text-sm font-medium ${sampleState === "error" ? "text-rose-700" : "text-emerald-700"}`}>
                  {sampleMessage}
                </p>
              ) : null}
            </div>
            <form action={loadSampleClientOrdersAction}>
              <button className="button-secondary" type="submit">
                Load sample client orders
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {!allOrders.length ? (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Get set up</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link className="rounded-[1.15rem] border border-slate-200 px-4 py-4 text-sm font-semibold text-[var(--penned-navy)]" href="/client/folders">
              Add your first client
            </Link>
            <Link className="rounded-[1.15rem] border border-slate-200 px-4 py-4 text-sm font-semibold text-[var(--penned-navy)]" href="/client/new-order">
              Place your first order
            </Link>
            <Link className="rounded-[1.15rem] border border-slate-200 px-4 py-4 text-sm font-semibold text-[var(--penned-navy)]" href="/client/help">
              Prefer a walkthrough? Book a call
            </Link>
          </div>
        </section>
      ) : null}

      <section id="review-queue" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Needs your review
            </h2>
            <p className="mt-2 text-sm text-slate-500">Updates every 30 seconds.</p>
          </div>
        </div>
        {filteredReviewQueue.length ? (
          <div className="space-y-3">
            {filteredReviewQueue.map((item) => (
              <div key={item.submissionId} className="dashboard-list-row">
                <div>
                  <Link className="font-semibold text-slate-950" href={`/client/orders/${item.orderId}`}>
                    {item.title}
                  </Link>
                  <p className="text-sm text-slate-500">Client: {item.clientLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{item.status}</p>
                  <p className="text-xs text-slate-500">Updated {item.due}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No review items match this search" : "Nothing to review"}
            body={
              query
                ? "Try a different search term or clear the workspace search."
                : "When a draft is ready, it'll appear here."
            }
          />
        )}
      </section>

      <section id="orders" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Recent orders
          </h2>
          <Link className="text-base font-medium text-slate-600" href="/client/orders">
            View all →
          </Link>
        </div>
        {recentOrders.length ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
            <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
              <p>Order</p>
              <p>Client</p>
              <p>Type</p>
              <p>Writer</p>
              <p>Status</p>
              <p>Date</p>
              <p></p>
            </div>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] items-center border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
              >
                <div>
                  <Link className="font-semibold text-slate-950" href={`/client/orders/${order.id}`}>
                    {order.name}
                  </Link>
                  <p className="text-xs text-slate-400">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <p>{order.clientLabel}</p>
                <p>{order.contentType}</p>
                <p>{order.writer.split(" ")[0] || order.writer}</p>
                <p>
                  <span className="dashboard-pill">{order.status}</span>
                </p>
                <p>{order.deadline}</p>
                <Link className="text-right text-lg text-slate-400" href={`/client/orders/${order.id}`}>
                  →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            body="Your latest orders will show here."
            actionHref="/client/new-order"
            actionLabel="New order"
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

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
      {actionHref && actionLabel ? (
        <Link className="button-primary mt-4 inline-flex" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
