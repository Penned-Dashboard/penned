import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { firstNameOnly } from "@/lib/writer-privacy";
import { requireRole } from "@/lib/auth";
import { getClientFolders, getClientOrders, getClientReviewQueue } from "@/lib/orders";

const COMPLETED = new Set(["Accepted", "Approved", "Completed"]);
const IN_REVIEW = new Set(["In Review", "Submitted", "Revision Requested"]);
const IN_PROGRESS = new Set(["Open", "Claimed", "In Progress", "Assigned", "Writing"]);
const PAGE_SIZE = 25;

export default async function ClientOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; folder?: string; month?: string; page?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const view = params.view ?? (undefined as string | undefined);
  const [orders, reviewQueue, folders] = await Promise.all([
    getClientOrders(user.profileId),
    getClientReviewQueue(user.profileId),
    getClientFolders(user.profileId),
  ]);
  const reviewOrderIds = new Set(reviewQueue.map((item) => item.orderId).filter(Boolean));
  const activeView = view ?? (reviewQueue.length ? "in-review" : "all");
  const page = Math.max(1, Number(params.page) || 1);

  const filtered = orders.filter((order) => {
    const matchesQuery = !query
      ? true
      : `${order.clientLabel} ${order.name} ${order.contentType} ${order.writer} ${order.status}`
          .toLowerCase()
          .includes(query);
    if (!matchesQuery) return false;

    if (params.folder && order.clientLabel !== params.folder) return false;
    if (params.month && !order.deadline.toLowerCase().includes(params.month.toLowerCase())) return false;

    if (activeView === "completed") return COMPLETED.has(order.status);
    if (activeView === "in-review") return IN_REVIEW.has(order.status) || reviewOrderIds.has(order.id);
    if (activeView === "in-progress") {
      return IN_PROGRESS.has(order.status) || (!COMPLETED.has(order.status) && !IN_REVIEW.has(order.status));
    }
    if (activeView === "approval") return order.status === "Waiting For Approval";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const emptyCopy =
    activeView === "completed"
      ? { title: "Nothing completed yet", body: "Approved orders move here so you can download them any time." }
      : activeView === "in-review"
        ? { title: "Nothing to review", body: "Drafts appear here when they're ready." }
        : activeView === "approval"
          ? { title: "Nothing waiting", body: "Orders that need sign-off appear here." }
          : query
            ? { title: "No orders match these filters", body: "Try another client or search term." }
            : { title: "No orders yet", body: "Place your first order and it'll show here." };

  function hrefFor(next: Record<string, string | undefined>) {
    const merged = {
      view: activeView === "all" ? undefined : activeView,
      q: query || undefined,
      folder: params.folder,
      month: params.month,
      page: undefined as string | undefined,
      ...next,
    };
    const search = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const qs = search.toString();
    return qs ? `/client/orders?${qs}` : "/client/orders";
  }

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
        { label: "In progress", href: hrefFor({ view: "in-progress", page: undefined }), active: activeView === "in-progress" },
        { label: "In review", href: hrefFor({ view: "in-review", page: undefined }), active: activeView === "in-review" },
        { label: "Waiting for approval", href: hrefFor({ view: "approval", page: undefined }), active: activeView === "approval" },
        { label: "Completed", href: hrefFor({ view: "completed", page: undefined }), active: activeView === "completed" },
        { label: "All", href: hrefFor({ view: undefined, page: undefined }), active: activeView === "all" },
      ]}
    >
      <form className="mb-2 flex flex-wrap gap-3" method="get">
        {activeView !== "all" ? <input name="view" type="hidden" value={activeView} /> : null}
        {query ? <input name="q" type="hidden" value={query} /> : null}
        <select className="dashboard-input max-w-xs" defaultValue={params.folder ?? ""} name="folder">
          <option value="">All clients</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.name}>
              {folder.name}
            </option>
          ))}
        </select>
        <input className="dashboard-input max-w-xs" defaultValue={params.month} name="month" type="month" />
        <button className="button-secondary" type="submit">
          Apply filters
        </button>
      </form>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        {pageRows.length ? (
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
            {pageRows.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_1fr_0.8fr_48px] items-center border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
              >
                <div>
                  <Link className="font-semibold text-slate-950" href={`/client/orders/${order.id}`}>
                    {order.name}
                  </Link>
                </div>
                <p>{order.clientLabel}</p>
                <p>{order.contentType}</p>
                <p>{firstNameOnly(order.writer)}</p>
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

        {filtered.length > PAGE_SIZE ? (
          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <p>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link className="button-secondary" href={hrefFor({ page: String(page - 1) })}>
                  Previous
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link className="button-secondary" href={hrefFor({ page: String(page + 1) })}>
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
