import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { OrderForm } from "@/components/order-form";
import { requireRole } from "@/lib/auth";
import { getClientFolders, getContentTypeOptions } from "@/lib/orders";

export default async function ClientNewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const [contentTypes, folders] = await Promise.all([
    getContentTypeOptions({ includeInactive: true }),
    getClientFolders(user.profileId),
  ]);
  const selectedType = contentTypes.find((item) => item.id === params.type) ?? null;

  return (
    <DashboardShell
      role="client"
      title="Create New Order"
      description="Choose the kind of content you need, complete the brief, and send it to the marketplace."
      ctaLabel={selectedType?.isOrderable ? "Review & Submit" : "Select Content Type"}
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
              {contentTypes.map((type) => {
                const cardClass = `rounded-[1.25rem] border px-5 py-5 transition ${
                  type.isOrderable
                    ? "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-80"
                }`;
                const body = (
                  <>
                    <h3 className="text-lg font-semibold text-slate-950">{type.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-900">What you’ll get:</span> {type.whatYouGet}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-900">Perfect for:</span> {type.perfectFor}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Price</span>
                      <span className="font-semibold text-slate-900">{type.priceLabel}</span>
                    </div>
                    {!type.isOrderable ? (
                      <p className="mt-3 text-sm font-semibold text-orange-600">Coming soon</p>
                    ) : null}
                  </>
                );

                return type.isOrderable ? (
                  <Link className={cardClass} href={`/client/new-order?type=${type.id}`} key={type.id}>
                    {body}
                  </Link>
                ) : (
                  <div className={cardClass} key={type.id}>
                    {body}
                  </div>
                );
              })}
            </div>
            {contentTypes.some((item) => item.isOrderable) ? (
              <div className="mt-8">
                <Link
                  className="button-primary"
                  href={`/client/new-order?type=${contentTypes.find((item) => item.isOrderable)?.id}`}
                >
                  Continue
                </Link>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                No content types are available yet. Seed content types in Supabase first.
              </p>
            )}
          </section>
        ) : selectedType.isOrderable ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(25,38,63,0.04)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Content Brief — {selectedType.name}
            </h2>
            <div className="mt-8">
              <OrderForm
                contentTypes={contentTypes}
                folders={folders}
                hideContentTypeSelect
                presetContentTypeId={selectedType.id}
              />
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-orange-200 bg-orange-50 p-6 shadow-[0_18px_40px_rgba(25,38,63,0.04)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {selectedType.name} is coming soon
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">
              This service is part of the planned catalog, but it is not open for direct ordering yet.
              Choose one of the active services for now and we’ll keep this option visible in the catalog.
            </p>
            <div className="mt-6">
              <Link className="button-primary" href="/client/new-order">
                Back to content types
              </Link>
            </div>
          </section>
        )}
      </section>
    </DashboardShell>
  );
}
