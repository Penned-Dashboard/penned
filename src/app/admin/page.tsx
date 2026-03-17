import { DashboardShell, SectionCard, StatCard } from "@/components/dashboard-shell";
import { adminDashboard } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      role="admin"
      title="Admin dashboard"
      description="Oversee marketplace health, billing operations, content catalog, and payouts."
      ctaLabel="Review payouts"
      ctaHref="#payouts"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminDashboard.metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Operations queue"
          description="Orders and disputes that need decisions before they block fulfillment."
        >
          <div className="space-y-3">
            {adminDashboard.operationsQueue.map((item) => (
              <div key={item.title} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.owner}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{item.state}</p>
                  <p className="text-xs text-slate-500">{item.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Content type catalog"
          description="Admin-seeded content types with pricing and default turnaround."
        >
          <div className="space-y-3">
            {adminDashboard.contentTypes.map((type) => (
              <div key={type.name} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{type.name}</p>
                  <p className="text-sm text-slate-500">{type.turnaround}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{type.price}</p>
                  <p className="text-xs text-slate-500">{type.status}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          id="payouts"
          title="Payout approvals"
          description="Stripe Connect should own the actual funds flow. This panel is the operational layer."
        >
          <div className="space-y-3">
            {adminDashboard.payouts.map((payout) => (
              <div key={payout.writer} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{payout.writer}</p>
                  <p className="text-sm text-slate-500">{payout.requestedAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{payout.amount}</p>
                  <p className="text-xs text-slate-500">{payout.status}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Ranking signals"
          description="Base points, recent-job multipliers, and external quality deductions all resolve here."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {adminDashboard.rankingRules.map((rule) => (
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
