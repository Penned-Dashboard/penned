import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import {
  getRankingBoard,
  getWriterAssignments,
  getWriterMarketplace,
  getWriterWallet,
} from "@/lib/orders";
import { claimOrderAction, loadSampleWriterOrdersAction, requestPayoutAction } from "@/app/writer/actions";

export default async function WriterDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sampleState?: string; sampleMessage?: string }>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const sampleState = params.sampleState === "error" ? "error" : params.sampleState === "success" ? "success" : null;
  const sampleMessage = params.sampleMessage?.trim() ?? "";
  const [liveJobs, assignments, wallet, rankings] = await Promise.all([
    getWriterMarketplace(),
    getWriterAssignments(user.profileId),
    getWriterWallet(user.profileId),
    getRankingBoard(),
  ]);
  const jobsBoard = filterByQuery(
    liveJobs,
    query,
    (job) => `${job.title} ${job.client} ${job.industry} ${job.status}`,
  );
  const filteredAssignments = filterByQuery(
    assignments,
    query,
    (item) => `${item.title} ${item.client} ${item.status}`,
  );
  const filteredRankings = filterByQuery(
    rankings,
    query,
    (item) => `${item.name} ${item.note} ${item.score} ${item.rating}`,
  );
  const metrics = [
    {
      label: "Your rank",
      value: rankings.find((entry) => entry.name === user.fullName)?.rank ?? "—",
      hint: "Where you currently sit on the writer leaderboard.",
    },
    {
      label: "Rating",
      value: rankings.find((entry) => entry.name === user.fullName)?.rating ?? "No rating",
      hint: "Average quality score from accepted work.",
    },
    {
      label: "Available payout",
      value: wallet.available,
      hint: "Money you can request for payout right now.",
    },
    {
      label: "Active assignments",
      value: String(assignments.length),
      hint: "Jobs you have already claimed and still need to finish.",
    },
  ];
  const filters = ["Open", "Claimed", "Revision", "Fast turnaround"];

  return (
    <DashboardShell
      role="writer"
      title="Writer Dashboard"
      description="Find new writing jobs, manage your current assignments, and track your earnings in one place."
      ctaLabel="Request Payout"
      ctaHref="#earnings"
      currentPath="/writer"
      userName={user.fullName}
      searchQuery={params.q}
      tabs={[
        { label: "Overview", href: "/writer", active: true },
        { label: "Job Marketplace", href: "/writer#job-marketplace", active: false },
        { label: "Rankings", href: "/writer#rankings", active: false },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`rounded-[1.5rem] border p-5 ${
              index === 0
                ? "border-orange-200 bg-orange-50"
                : index === 1
                  ? "border-cyan-200 bg-cyan-50"
                  : index === 2
                    ? "border-indigo-200 bg-indigo-50"
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
              Load sample jobs for stakeholder review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Add one completed assignment, one active assignment, and one open marketplace job so the writer flow is ready for feedback immediately.
            </p>
            {sampleMessage ? (
              <p className={`mt-3 text-sm font-medium ${sampleState === "error" ? "text-rose-700" : "text-emerald-700"}`}>
                {sampleMessage}
              </p>
            ) : null}
          </div>
          <form action={loadSampleWriterOrdersAction}>
            <button className="button-secondary" type="submit">
              Load sample writer jobs
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="earnings" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">Earnings Overview</h2>
            <span className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">
              Last 30 days
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoTile label="Total Earned" value={sumCurrency(wallet.activity) || "$0"} accent="text-slate-950" />
            <InfoTile label="Available" value={wallet.available} accent="text-emerald-500" />
            <InfoTile label="Pending" value={wallet.pending} accent="text-orange-500" />
          </div>
          <form action={requestPayoutAction} className="mt-6 flex flex-wrap items-center gap-3">
            <input className="dashboard-input max-w-40" defaultValue="250" min="1" name="amount" step="1" type="number" />
            <button className="button-primary" type="submit">
              Request Payout ({wallet.available})
            </button>
          </form>
        </section>

        <section id="my-jobs" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Active Submissions</h2>
          <div className="mt-6 space-y-3">
            {filteredAssignments.length ? (
              filteredAssignments.map((submission) => (
                <Link
                  key={submission.id}
                  className="block rounded-[1.15rem] bg-slate-50 p-4"
                  href={`/writer/orders/${submission.id}`}
                >
                  <p className="font-semibold text-slate-950">{submission.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{submission.status}</p>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No active submissions"
                body="Claim a job from the marketplace and it will appear here."
              />
            )}
          </div>
        </section>
      </section>

      <section id="job-marketplace" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Job Marketplace</h2>
            <p className="mt-2 text-sm text-slate-500">Open work you can claim right now.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <span key={filter} className="dashboard-pill">
                {filter}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
            {jobsBoard.length ? (
              jobsBoard.map((job) => (
                <div key={job.id} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{job.title}</p>
                  <p className="text-sm text-slate-500">
                    {job.client} · {job.industry}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{job.pay}</p>
                  <p className="text-xs text-slate-500">{job.turnaround}</p>
                </div>
                <form action={claimOrderAction}>
                  <input name="orderId" type="hidden" value={job.id} />
                  <button className="button-secondary" type="submit">
                    Claim
                  </button>
                </form>
              </div>
            ))
          ) : (
            <EmptyState
              title="No open jobs right now"
              body="New client orders will appear here as soon as they enter the marketplace."
            />
          )}
        </div>
      </section>

      <section id="rankings" className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold text-slate-950">Rankings</h2>
        <div className="mt-6 space-y-3">
          {filteredRankings.length ? (
            filteredRankings.map((entry) => (
              <div key={entry.name} className="dashboard-list-row">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] text-sm font-semibold text-white">
                    {entry.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{entry.name}</p>
                    <p className="text-sm text-slate-500">{entry.note}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{entry.score}</p>
                  <p className="text-xs text-slate-500">{entry.rating}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No leaderboard data yet"
              body="Ranking entries will appear after accepted jobs start generating score updates."
            />
          )}
        </div>
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

function InfoTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1.15rem] bg-slate-50 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-5xl font-semibold tracking-[-0.05em] ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function sumCurrency(activity: { amount: string }[]) {
  let total = 0;

  for (const item of activity) {
    const numeric = Number(item.amount.replace(/[^0-9.-]/g, ""));

    if (!Number.isNaN(numeric) && numeric > 0) {
      total += numeric;
    }
  }

  return total ? `$${total.toLocaleString()}` : "";
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}
