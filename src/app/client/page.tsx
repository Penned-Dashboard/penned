import { DashboardShell, SectionCard, StatCard } from "@/components/dashboard-shell";
import { clientDashboard } from "@/lib/mock-data";

export default function ClientDashboardPage() {
  return (
    <DashboardShell
      role="client"
      title="Client dashboard"
      description="Order content, review drafts, manage revisions, and keep billing in one place."
      ctaLabel="Create new order"
      ctaHref="#order-form"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {clientDashboard.metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          id="order-form"
          title="Create new order"
          description="This form is wired as the MVP contract for your Supabase `orders` table."
        >
          <form className="grid gap-4 md:grid-cols-2">
            {clientDashboard.orderFormFields.map((field) => (
              <label key={field.label} className={field.large ? "md:col-span-2" : ""}>
                <span className="dashboard-label">{field.label}</span>
                {field.kind === "textarea" ? (
                  <textarea
                    className="dashboard-input min-h-28"
                    placeholder={field.placeholder}
                    readOnly
                  />
                ) : (
                  <input
                    className="dashboard-input"
                    placeholder={field.placeholder}
                    readOnly
                    type={field.kind}
                  />
                )}
              </label>
            ))}
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-orange-50 px-4 py-3 text-sm text-orange-900">
              <p>Demo mode is read-only. Hook this form to a server action or Supabase RPC next.</p>
              <button className="button-primary" type="button">
                Submit order
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Submission review queue"
          description="High-priority drafts that need approval or revision decisions."
        >
          <div className="space-y-3">
            {clientDashboard.reviewQueue.map((item) => (
              <div key={item.title} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {item.writer} · {item.due}
                  </p>
                </div>
                <span className="dashboard-pill">{item.status}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Active orders"
          description="Current jobs and where each one sits in the lifecycle."
        >
          <div className="space-y-3">
            {clientDashboard.activeOrders.map((order) => (
              <div key={order.name} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{order.name}</p>
                  <p className="text-sm text-slate-500">
                    {order.contentType} · {order.writer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{order.status}</p>
                  <p className="text-xs text-slate-500">{order.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Billing and plan"
          description="Subscription, invoice, and premium support snapshot."
        >
          <div className="space-y-4">
            <div className="rounded-[1.25rem] bg-slate-950 p-5 text-slate-50">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-200">Current plan</p>
              <h3 className="mt-2 text-3xl font-semibold">Pro</h3>
              <p className="mt-2 text-sm text-slate-300">
                Includes preferred writers, billing history, and Slack support.
              </p>
            </div>
            {clientDashboard.invoices.map((invoice) => (
              <div key={invoice.id} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">{invoice.id}</p>
                  <p className="text-sm text-slate-500">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{invoice.amount}</p>
                  <p className="text-xs text-slate-500">{invoice.status}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}
