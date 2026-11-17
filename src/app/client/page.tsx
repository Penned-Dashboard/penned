import Link from "next/link";
import { loadSampleClientOrdersAction } from "@/app/client/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceAutoRefresh } from "@/components/workspace-auto-refresh";
import { requireRole } from "@/lib/auth";
import { getClientWalletAvailableCents, getContentBudgetSnapshot } from "@/lib/content-budget";
import { allowDemoTools } from "@/lib/env";
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

  const [liveOrders, reviewQueue, invoices, folders, availableCents] = await Promise.all([
    getClientOrders(user.profileId),
    getClientReviewQueue(user.profileId),
    getInvoices(user.profileId),
    getClientFolders(user.profileId),
    getClientWalletAvailableCents(user.profileId),
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

  const budget = getContentBudgetSnapshot(liveOrders, invoices, {
    availableCents,
    allowDemoFigures: allowDemoTools(),
  });
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
  const showSampleLoader = allowDemoTools() && Boolean(user.canSwitchRoles);
  // One line under the welcome, from what is already loaded above.
  const activeCount = liveOrders.length - liveOrders.filter((order) => ["Accepted", "Approved", "Completed"].includes(order.status)).length;
  const questionCount = liveOrders.filter((order) => order.status === "We have a question").length;
  const reviewCount = reviewQueue.length;
  const summaryLine = !liveOrders.length
    ? "Let's get your first piece written."
    : questionCount
      ? `We have a question on ${questionCount === 1 ? "one order" : `${questionCount} orders`}. Open it below to reply.`
      : reviewCount
        ? `${reviewCount} draft${reviewCount === 1 ? " is" : "s are"} ready for your review.`
        : activeCount
          ? `${activeCount} order${activeCount === 1 ? "" : "s"} in progress. Nothing needs you right now.`
          : "Everything is approved. Nothing needs you right now.";

  return (
    <DashboardShell
      role="client"
      title={workspaceTitle}
      titleStyle="welcome"
      description={summaryLine}
      ctaLabel="New order"
      ctaHref="/client/new-order"
      currentPath="/client"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/client"
    >
      <WorkspaceAutoRefresh />

      <section className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`flex flex-col gap-1 rounded-[20px] border px-4 py-4 hover:border-[var(--penned-navy)] md:px-6 md:py-5 ${
              index === 1 && metric.value !== "0"
                ? "border-[#cfe07a] bg-[var(--penned-lime-wash)]"
                : "border-[var(--line)] bg-white"
            }`}
          >
            <p className="text-[14.5px] font-bold text-[var(--penned-navy)]">{metric.label}</p>
            <h2 className="text-[30px] font-bold leading-[1.05] tracking-[-0.02em] tabular-nums text-[var(--penned-navy)] md:text-[40px]">
              {metric.value}
            </h2>
            <p className="text-[13px] leading-5 text-[var(--ink-2)] md:text-[14.5px] md:leading-6">{metric.hint}</p>
          </Link>
        ))}
      </section>

      {showSampleLoader ? (
        <section className={`rounded-[20px] border px-6 py-5 ${
          sampleState === "error"
            ? "border-rose-200 bg-rose-50"
            : sampleState === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-[var(--line)] bg-white"
        }`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-3)]">
                Demo only
              </p>
              <h2 className="mt-1 text-[19px] font-bold tracking-[-0.015em] text-[var(--penned-navy)]">
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
        <section className="rounded-[20px] border border-[var(--line)] bg-white p-[18px] md:p-6">
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-[var(--penned-navy)]">Get set up</h2>
          <div className="setup-steps mt-4 grid gap-3 md:grid-cols-3">
            <Link className="setup-step" href="/client/folders">
              Add your first client
            </Link>
            <Link className="setup-step" href="/client/new-order">
              Place your first order
            </Link>
            <Link className="setup-step" href="/client/help?topic=walkthrough">
              Prefer a walkthrough? Book a call
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
      <section
        id="review-queue"
        className={`flex min-w-0 flex-col rounded-[20px] border p-[18px] md:p-6 ${
          filteredReviewQueue.length
            ? "border-[#cfe07a] bg-[linear-gradient(180deg,var(--penned-lime-wash)_0,#fff_96px)]"
            : "border-[var(--line)] bg-white"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-[var(--penned-navy)]">
            Needs your review
          </h2>
          <p className="text-[14.5px] text-[var(--ink-2)]">Updates every 30 seconds.</p>
        </div>
        {filteredReviewQueue.length ? (
          <>
            <div className="home-rows">
              {filteredReviewQueue.map((item) => (
                <div key={item.submissionId} className="home-row">
                  <div className="min-w-0 flex-1">
                    <Link className="home-row-title" href={`/client/orders/${item.orderId}`}>
                      {item.title}
                    </Link>
                    <p className="home-row-sub">Client: {item.clientLabel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p><span className="dashboard-pill is-you">{item.status}</span></p>
                    <p className="mt-1 text-[13.5px] text-[var(--ink-2)]">Updated {item.due}</p>
                  </div>
                </div>
              ))}
            </div>
            {filteredReviewQueue.length <= 3 ? <div aria-hidden="true" className="notepad-fill" /> : null}
          </>
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

      <section id="orders" className="flex min-w-0 flex-col rounded-[20px] border border-[var(--line)] bg-white p-[18px] md:p-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-[var(--penned-navy)]">
            Recent orders
          </h2>
          <Link className="text-[14.5px] font-semibold text-[var(--penned-navy)] underline decoration-[var(--line-2)] underline-offset-4 hover:decoration-current" href="/client/orders">
            View all →
          </Link>
        </div>
        {recentOrders.length ? (
          <div className="home-rows">
            {recentOrders.map((order) => (
              <div key={order.id} className="home-row">
                <div className="min-w-0 flex-1">
                  <Link className="home-row-title" href={`/client/orders/${order.id}`}>
                    {order.name}
                  </Link>
                  <p className="home-row-sub">
                    <span className="font-mono text-[12px] text-[var(--ink-3)]">{order.id.slice(0, 8).toUpperCase()}</span>
                    {" · "}
                    {order.clientLabel}
                    {" · "}
                    {order.contentType}
                    {" · "}
                    {order.writer.split(" ")[0] || order.writer}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p>
                    <span className="dashboard-pill">{order.status}</span>
                  </p>
                  <p className="mt-1 text-[13.5px] text-[var(--ink-2)]">{order.deadline}</p>
                </div>
                <Link aria-label={`Open ${order.name}`} className="shrink-0 text-lg text-[var(--ink-3)] hover:text-[var(--penned-navy)]" href={`/client/orders/${order.id}`}>
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
      </div>
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
    <div className="grid flex-1 place-content-center rounded-[14px] border border-dashed border-[var(--line-2)] bg-[#fbfcfe] px-5 py-8 text-center text-[14.5px] leading-6 text-[var(--ink-2)]">
      <p className="text-base font-bold text-[var(--penned-navy)]">{title}</p>
      <p className="mt-1">{body}</p>
      {actionHref && actionLabel ? (
        <Link className="button-primary mt-4 justify-self-center" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
