import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { EmptyState, MetricCard, Notice, type NoticeParams } from "@/components/writer-ui";
import { requireRole } from "@/lib/auth";
import { getWriterHomeSnapshot, type WriterActivityItem } from "@/lib/orders";
import { formatRelativeTime } from "@/lib/writer-status";
import { loadSampleWriterOrdersAction } from "@/app/writer/actions";

const ACTIVITY_DOT: Record<WriterActivityItem["kind"], string> = {
  claim: "bg-blue-500",
  submission: "bg-violet-500",
  feedback: "bg-amber-500",
  revision: "bg-amber-500",
  approval: "bg-emerald-500",
  earning: "bg-emerald-500",
  payout: "bg-cyan-500",
};

export default async function WriterDashboardPage({
  searchParams,
}: {
  searchParams: Promise<NoticeParams & { q?: string; sampleState?: string; sampleMessage?: string }>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const sampleState = params.sampleState === "error" ? "error" : params.sampleState === "success" ? "success" : null;
  const sampleMessage = params.sampleMessage?.trim() ?? "";
  const snapshot = await getWriterHomeSnapshot(user.profileId);
  const feed = query
    ? snapshot.activityFeed.filter((item) => item.text.toLowerCase().includes(query))
    : snapshot.activityFeed;
  const action = snapshot.nextAction;

  return (
    <DashboardShell
      role="writer"
      title="Writer Dashboard"
      description="Your week at a glance: what is due, what you have earned, and what to do next."
      currentPath="/writer"
      userName={user.fullName}
      searchQuery={params.q}
    >
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Jobs due this week"
          value={String(snapshot.jobsDueThisWeek)}
          hint="Active jobs due in the next 7 days, including overdue."
          tone="orange"
        />
        <MetricCard
          label="This month's earnings"
          value={snapshot.monthEarnings}
          hint="Approved work credited since the 1st."
          tone="cyan"
        />
        <MetricCard
          label="Current rank"
          value={snapshot.currentRank ? `#${snapshot.currentRank}` : "—"}
          hint={
            snapshot.currentRank
              ? `Out of ${snapshot.rankedWriters} ranked writers.`
              : "Complete an approved job to enter the rankings."
          }
          tone="indigo"
        />
        <MetricCard
          label="Unread feedback"
          value={String(snapshot.unreadFeedback)}
          hint="Jobs where a client requested revisions."
        />
      </section>

      <section
        className={`rounded-[1.75rem] border p-6 ${
          action.tone === "urgent"
            ? "border-amber-200 bg-amber-50"
            : action.tone === "normal"
              ? "border-blue-200 bg-blue-50"
              : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Next action</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{action.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{action.description}</p>
          </div>
          <Link className="button-primary" href={action.href}>
            {action.ctaLabel}
          </Link>
        </div>
      </section>

      <SectionCard title="Recent activity" description="Claims, submissions, feedback, and payments across your jobs.">
        {feed.length ? (
          <ul className="space-y-3">
            {feed.map((item) => {
              const content = (
                <>
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACTIVITY_DOT[item.kind]}`} />
                  <p className="flex-1 text-sm font-medium text-slate-800">{item.text}</p>
                  <p className="shrink-0 text-xs text-slate-500">{formatRelativeTime(item.at)}</p>
                </>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link className="dashboard-list-row items-start" href={item.href}>
                      {content}
                    </Link>
                  ) : (
                    <div className="dashboard-list-row items-start">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No activity yet"
            body="Claim a job from the marketplace and your progress will show up here."
          />
        )}
      </SectionCard>

      <section
        className={`rounded-[1.5rem] border px-5 py-4 ${
          sampleState === "error"
            ? "border-rose-200 bg-rose-50"
            : sampleState === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Review Setup</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Load sample jobs for stakeholder review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Add one completed assignment, one active assignment, and one open marketplace job so the writer flow is
              ready for feedback immediately.
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
    </DashboardShell>
  );
}
