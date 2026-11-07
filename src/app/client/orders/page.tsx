import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientOrders, getClientReviewQueue } from "@/lib/orders";

const COMPLETED = new Set(["Accepted", "Approved", "Completed"]);
const IN_REVIEW = new Set(["In Review", "Submitted", "Revision Requested"]);
const IN_PROGRESS = new Set(["Open", "Claimed", "In Progress", "Assigned", "Writing"]);

export default async function ClientOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const view = params.view ?? "all";
  const [orders, reviewQueue] = await Promise.all([
    getClientOrders(user.profileId),
    getClientReviewQueue(user.profileId),
  ]);
  const reviewOrderIds = new Set(reviewQueue.map((item) => item.orderId).filter(Boolean));

  const filtered = orders.filter((order) => {
    const matchesQuery = !query
      ? true
      : `${order.clientLabel} ${order.name} ${order.contentType} ${order.writer} ${order.status}`
          .toLowerCase()
          .includes(query);

    if (!matchesQuery) return false;

    if (view === "completed") return COMPLETED.has(order.status);
    if (view === "in-review") return IN_REVIEW.has(order.status) || reviewOrderIds.has(order.id);
    if (view === "in-progress") {
      return IN_PROGRESS.has(order.status) || (!COMPLETED.has(order.status) && !IN_REVIEW.has(order.status));
    }
    if (view === "approval") return order.status === "Waiting For Approval";
    return true;
  });

  const emptyCopy =
    view === "completed"
      ? {
          title: "Nothing completed yet",
          body: "Approved orders move here so you can download them any time.",
        }
      : view === "in-review"
        ? {
            title: "Nothing to review",
            body: "Drafts appear here when they're ready.",
          }
        : view === "approval"
          ? {
              title: "Nothing waiting",
              body: "Orders that need sign-off appear here.",
            }
          : query
            ? {
                title: "No orders match these filters",
                body: "Try another client or search term.",
              }
            : {
                title: "No orders yet",
                body: "Place your first order and it'll show here.",
              };

  return (
    <DashboardShell
      role="client"
      title="Orders"
      description=""
      ctaLabel="New order"
      ctaHref="/client/new-order"
      currentPath="/client/orders"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/client/orders"
      tabs={[
        { label: "In progress", href: "/client/orders?view=in-progress", active: view === "in-progress" },
        { label: "In review", href: "/client/orders?view=in-review", active: view === "in-review" },
        { label: "Waiting for approval", href: "/client/orders?view=approval", active: view === "approval" },
        { label: "Completed", href: "/client/orders?view=completed", active: view === "completed" },
        { label: "All", href: "/client/orders", active: view === "all" },
      ]}
    >
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        {filtered.length ? (
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
            <div className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
              <p>Order</p>
              <p>Client</p>
              <p>Type</p>
              <p>Writer</p>
              <p>Status</p>
              <p>Date</p>
              <p></p>
            </div>
            {filtered.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] items-center border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
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
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
            <p className="font-semibold text-slate-900">{emptyCopy.title}</p>
            <p className="mt-2">{emptyCopy.body}</p>
            <Link className="button-primary mt-5 inline-flex" href="/client/new-order">
              New order
            </Link>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
