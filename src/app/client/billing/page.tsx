import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getInvoices } from "@/lib/orders";

export default async function ClientBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; checkout?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const invoices = await getInvoices(user.profileId);

  return (
    <DashboardShell
      role="client"
      title="Billing"
      description="Manage subscriptions, compare plans, and review invoice history."
      ctaLabel="Back to client dashboard"
      ctaHref="/client"
      currentPath="/client/billing"
      userName={user.fullName}
    >
      {params.setup === "stripe-missing" ? (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Stripe is connected, but the plan price IDs are still missing. Add
          `STRIPE_BASIC_PRICE_ID` and `STRIPE_PRO_PRICE_ID` to finish live checkout.
        </div>
      ) : null}
      {params.checkout === "cancelled" ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          Checkout was cancelled. You can restart it whenever you are ready.
        </div>
      ) : null}
      {params.checkout === "success" ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Checkout completed. Stripe will update your subscription record after the
          webhook is configured.
        </div>
      ) : null}
      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Plans"
          description="Choose the right support tier for your content workflow."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard
              name="Starter"
              price="$0 / month"
              features={[
                "Create your workspace for free",
                "Explore the dashboard and order setup",
                "Upgrade when you are ready to publish",
              ]}
              href="/client"
              ctaLabel="Included"
              variant="secondary"
            />
            <PlanCard
              name="Basic"
              price="$499 / month"
              features={[
                "Content ordering and dashboard access",
                "Review queue and revision loop",
                "Writer marketplace visibility",
              ]}
              href="/api/stripe/checkout?plan=basic"
              ctaLabel="Start checkout"
            />
            <PlanCard
              name="Pro"
              price="$999 / month"
              features={[
                "Preferred writers and premium support",
                "Billing visibility and faster turnaround",
                "Closer editorial coordination",
              ]}
              href="/api/stripe/checkout?plan=pro"
              ctaLabel="Start checkout"
              featured
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Invoices"
          description="Recent subscription records and billing events."
        >
          {invoices.length ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
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
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-950">No invoices yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Once a Stripe subscription is active, invoices and billing events will
                appear here automatically.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">Current workspace</p>
                  <p className="mt-2 text-sm text-slate-500">
                    You can stay on Starter while testing the intake flow.
                  </p>
                </div>
                <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">Next step</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add your Stripe price IDs and webhook secret to turn invoices live.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function PlanCard({
  name,
  price,
  features,
  href,
  ctaLabel,
  variant,
  featured,
}: {
  name: string;
  price: string;
  features: string[];
  href: string;
  ctaLabel: string;
  variant?: "primary" | "secondary";
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        featured
          ? "border-white/80 bg-[linear-gradient(135deg,rgba(37,99,235,0.09),rgba(43,182,168,0.12))] text-slate-950"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{name}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{price}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-6 opacity-90">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <a
        className={`${variant === "secondary" ? "button-secondary" : "button-primary"} mt-5 inline-flex`}
        href={href}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
