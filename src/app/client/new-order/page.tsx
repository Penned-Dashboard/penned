import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { OrderForm } from "@/components/order-form";
import { requireRole } from "@/lib/auth";
import { getContentTypeOptions } from "@/lib/orders";

export default async function ClientNewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const contentTypes = await getContentTypeOptions();
  const selectedType = contentTypes.find((item) => item.id === params.type) ?? null;

  return (
    <DashboardShell
      role="client"
      title="Create New Order"
      description="Choose the kind of content you need, complete the brief, and send it to the marketplace."
      ctaLabel={selectedType ? "Review & Submit" : "Select Content Type"}
      ctaHref="#new-order-flow"
      currentPath="/client/new-order"
      userName={user.fullName}
      tabs={[
        { label: "Content Type", href: "/client/new-order", active: !selectedType },
        { label: "Brief Details", href: selectedType ? `/client/new-order?type=${selectedType.id}` : "/client/new-order", active: Boolean(selectedType) },
        { label: "Review & Submit", href: "#new-order-flow", active: false },
      ]}
    >
      <section id="new-order-flow" className="grid gap-6">
        {!selectedType ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(25,38,63,0.04)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Select Content Type
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {contentTypes.map((type) => (
                <Link
                  key={type.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-5 transition hover:border-blue-400 hover:bg-blue-50"
                  href={`/client/new-order?type=${type.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{type.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{type.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {type.turnaroundDays}d
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Suggested turnaround</span>
                    <span className="font-semibold text-slate-900">{type.turnaroundDays} business days</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Starting price</span>
                    <span className="font-semibold text-slate-900">${(type.basePriceCents / 100).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
            {contentTypes.length ? (
              <div className="mt-8">
                <Link className="button-primary" href={`/client/new-order?type=${contentTypes[0].id}`}>
                  Continue
                </Link>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                No content types are available yet. Seed content types in Supabase first.
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(25,38,63,0.04)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Content Brief — {selectedType.name}
            </h2>
            <div className="mt-8">
              <OrderForm
                contentTypes={contentTypes}
                hideContentTypeSelect
                presetContentTypeId={selectedType.id}
              />
            </div>
          </section>
        )}
      </section>
    </DashboardShell>
  );
}
