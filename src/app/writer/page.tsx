import { DashboardShell, SectionCard, StatCard } from "@/components/dashboard-shell";
import { writerDashboard } from "@/lib/mock-data";

export default function WriterDashboardPage() {
  return (
    <DashboardShell
      role="writer"
      title="Writer dashboard"
      description="Claim jobs, submit drafts, track revisions, and monitor earnings."
      ctaLabel="View jobs board"
      ctaHref="#jobs-board"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {writerDashboard.metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          id="jobs-board"
          title="Job marketplace"
          description="A filtered queue of claimable assignments. This maps to `orders` plus writer preferences."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {writerDashboard.filters.map((filter) => (
              <span key={filter} className="dashboard-pill">
                {filter}
              </span>
            ))}
          </div>
          <div className="space-y-3">
            {writerDashboard.jobsBoard.map((job) => (
              <div key={job.title} className="dashboard-list-row">
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
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Submission status"
          description="Current drafts, review comments, and next revision deadline."
        >
          <div className="space-y-3">
            {writerDashboard.submissions.map((submission) => (
              <div key={submission.title} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{submission.title}</p>
                  <p className="text-sm text-slate-500">
                    {submission.client} · {submission.docType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{submission.status}</p>
                  <p className="text-xs text-slate-500">{submission.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Earnings and wallet"
          description="Simple wallet tracking for the MVP. Real payouts should be backed by Stripe Connect."
        >
          <div className="rounded-[1.25rem] bg-emerald-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">
              Available balance
            </p>
            <h3 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
              {writerDashboard.wallet.available}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Pending payouts: {writerDashboard.wallet.pending}
            </p>
            <button className="button-primary mt-5" type="button">
              Request payout
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {writerDashboard.wallet.activity.map((entry) => (
              <div key={entry.label} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{entry.label}</p>
                  <p className="text-sm text-slate-500">{entry.date}</p>
                </div>
                <div className="text-right text-sm font-medium text-slate-700">
                  {entry.amount}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Ranking leaderboard"
          description="Recent jobs carry higher weight. Google Sheet quality deductions can plug into the ranking event log."
        >
          <div className="space-y-3">
            {writerDashboard.rankings.map((entry) => (
              <div key={entry.name} className="dashboard-list-row">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
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
            ))}
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}
