import Link from "next/link";
import { loadSampleClientOrdersAction } from "@/app/client/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceAutoRefresh } from "@/components/workspace-auto-refresh";
import { requireRole } from "@/lib/auth";
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

  const workspaceTitle = `${user.fullName}'s Content Ops Engine`;
  const allOrders = filterByQuery(
    liveOrders,
    query,
    (order) => `${order.clientLabel} ${order.name} ${order.contentType} ${order.writer} ${order.status}`,
  );
  const recentOrders = allOrders.slice(0, 6);
  const completedOrders = allOrders.filter((order) => order.status === "Accepted");
  const clientFolders = folders.length
    ? folders.map((folder) => folder.name)
    : Array.from(new Set(allOrders.map((order) => order.clientLabel))).filter(Boolean);
  const filteredReviewQueue = filterByQuery(
    reviewQueue,
    query,
    (item) => `${item.clientLabel} ${item.title} ${item.writer} ${item.status}`,
  );

  const currentPlan = (invoices[0]?.amount ?? "basic").toLowerCase();
  const estimatedBudget = currentPlan.includes("pro") ? 5000 : currentPlan.includes("basic") ? 2500 : 750;
  const estimatedRemaining = Math.max(estimatedBudget - allOrders.length * 175, 0);
  const billingMode = currentPlan.includes("pro") ? "Monthly invoice" : allOrders.length > 2 ? "Prepaid wallet" : "Pay per order";

  const metrics = [
    {
      label: "Active orders",
      value: String(allOrders.length),
      hint: "Live briefs currently attached to your workspace.",
    },
    {
      label: "In review",
      value: String(reviewQueue.length),
      hint: "Submissions that need feedback or approval.",
    },
    {
      label: "Completed orders",
      value: String(completedOrders.length),
      hint: "Approved work stored in your completed archive.",
    },
    {
      label: "Content budget",
      value: `$${estimatedRemaining.toLocaleString()}`,
      hint: `${billingMode} · estimated available balance`,
    },
  ];

  return (
    <DashboardShell
      role="client"
      title={workspaceTitle}
      description="Run single orders, manage client workspaces, and keep agency content operations organized in one place."
      ctaLabel="Create New Order"
      ctaHref="/client/new-order"
      currentPath="/client"
      userName={user.fullName}
      searchQuery={params.q}
      tabs={[
        { label: "Overview", href: "/client", active: true },
        { label: "All Orders", href: "/client/orders", active: false },
        { label: "Client Folders", href: "/client/folders", active: false },
      ]}
    >
      <WorkspaceAutoRefresh />

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
            <p className="mt-3 text-sm text-slate-500">{metric.hint}</p>
          </article>
        ))}
      </section>

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
              Review Setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Load sample orders for stakeholder review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Add one completed order and one in-review order so the dashboard, queues, and archive flows have realistic data to review.
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

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Flexible billing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {billingMode}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This workspace is framed around content budget visibility rather than subscription plans. Use billing to review invoices, wallet top-ups, and monthly account limits.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Remaining budget</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                ${estimatedRemaining.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Agency clients tracked</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {clientFolders.length || "0"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="button-primary" href="/client/billing">
              Manage billing
            </Link>
            <Link className="button-secondary" href="/client/folders">
              Open client folders
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Workflow summary
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                Built for agencies managing multiple clients
              </h2>
            </div>
            <Link className="text-sm font-medium text-slate-500" href="/client/orders">
              View all orders
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SummaryItem label="Single orders" value="Live" note="Keep the existing one-off ordering flow for urgent or trial work." />
            <SummaryItem label="Completed archive" value={String(completedOrders.length)} note="Approved work stays accessible from the completed orders page." />
            <SummaryItem label="Client folders" value={String(clientFolders.length)} note="Use folders to organize briefs, preferences, and recurring client context." />
          </div>
        </div>
      </section>

      <section id="orders" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Recent Orders
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

      <section id="review-queue" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Review Queue
            </h2>
            <p className="mt-2 text-sm text-slate-500">Updates refresh automatically every 30 seconds.</p>
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

function SummaryItem({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}
