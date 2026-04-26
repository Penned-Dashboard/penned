import Link from "next/link";
import { approvePayoutAction } from "@/app/admin/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import {
  getAdminOrderQueue,
  getContentTypeCatalog,
  getPayoutRequests,
} from "@/lib/orders";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const [operationsQueue, payouts, contentTypes] = await Promise.all([
    getAdminOrderQueue(),
    getPayoutRequests(),
    getContentTypeCatalog(),
  ]);
  const filteredOperations = filterByQuery(
    operationsQueue,
    query,
    (item) => `${item.title} ${item.owner} ${item.state}`,
  );
  const filteredPayouts = filterByQuery(
    payouts,
    query,
    (item) => `${item.writer} ${item.amount} ${item.status}`,
  );
  const filteredContentTypes = filterByQuery(
    contentTypes,
    query,
    (item) => `${item.name} ${item.turnaround} ${item.price} ${item.status}`,
  );
  const metrics = [
    {
      label: "Revenue",
      value: "Live via Stripe",
      hint: "Subscription revenue appears once billing webhooks are configured.",
    },
    {
      label: "Jobs this month",
      value: String(operationsQueue.length),
      hint: "Current orders visible to the admin workspace.",
    },
    {
      label: "Active writers",
      value: "Profile-based",
      hint: "Writer utilization expands as real workspace users are added.",
    },
    {
      label: "Open payouts",
      value: String(payouts.filter((item) => item.status.toLowerCase() === "pending").length),
      hint: "Pending payout approvals waiting on admin review.",
    },
  ];
  const rankingRules = [
    { label: "Completed job", value: "+10", note: "Base credit for accepted work." },
    { label: "High rating bonus", value: "+5", note: "Applies when the rating threshold is met." },
    { label: "Quality deduction", value: "-5", note: "Reserved for manual QA or operational penalties." },
  ];

  return (
    <DashboardShell
      role="admin"
      title="Admin Dashboard"
      description="Monitor orders, payouts, content types, and platform operations from one control panel."
      ctaLabel="Review Payouts"
      ctaHref="#payouts"
      currentPath="/admin"
      userName={user.fullName}
      searchQuery={params.q}
      tabs={[
        { label: "Overview", href: "/admin", active: true },
        { label: "Orders", href: "/admin#operations", active: false },
        { label: "Payouts", href: "/admin#payouts", active: false },
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
            <p className="mt-3 text-sm text-slate-500">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          id="operations"
          title="Operations Queue"
          description="Orders and issues that need admin attention before they block fulfillment."
        >
          <div className="space-y-3">
            {filteredOperations.length ? (
              filteredOperations.map((item) => (
                <Link key={item.id} className="dashboard-list-row" href={`/admin/orders/${item.id}`}>
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.owner}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{item.state}</p>
                    <p className="text-xs text-slate-500">{item.deadline}</p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No orders to oversee yet"
                body="Client orders will appear here once the first briefs are submitted."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          id="content-types"
          title="Content Type Catalog"
          description="Manage the content options clients can order, along with price and turnaround."
        >
          <div className="space-y-3">
            {filteredContentTypes.length ? (
              filteredContentTypes.map((type) => (
                <div key={type.id} className="dashboard-list-row">
                  <div>
                    <p className="font-semibold text-slate-950">{type.name}</p>
                    <p className="text-sm text-slate-500">{type.turnaround}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{type.price}</p>
                    <p className="text-xs text-slate-500">{type.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No content types found"
                body="Run the seed data or add catalog entries before clients create orders."
              />
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          id="payouts"
          title="Payout Approvals"
          description="Review writer payout requests before funds are released."
        >
          <div className="space-y-3">
            {filteredPayouts.length ? (
              filteredPayouts.map((payout) => (
                <div key={payout.id} className="dashboard-list-row">
                  <div>
                    <p className="font-semibold text-slate-950">{payout.writer}</p>
                    <p className="text-sm text-slate-500">{payout.requestedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{payout.amount}</p>
                    <p className="text-xs text-slate-500">{payout.status}</p>
                  </div>
                  {payout.status.toLowerCase() === "pending" || payout.status.toLowerCase() === "awaiting release" ? (
                    <form action={approvePayoutAction}>
                      <input name="payoutRequestId" type="hidden" value={payout.id} />
                      <button className="button-secondary" type="submit">
                        Approve
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState
                title="No payout requests yet"
                body="Writer payout requests will show up here after they request withdrawals."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Platform Rules"
          description="Core scoring and operational rules that shape the marketplace."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {rankingRules.map((rule) => (
              <div
                key={rule.label}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {rule.label}
                </p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {rule.value}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{rule.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>
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
