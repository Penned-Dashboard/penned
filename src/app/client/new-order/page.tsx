import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { OrderForm } from "@/components/order-form";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientFolders, getClientOrders, getContentTypeOptions, getInvoices } from "@/lib/orders";
import type { ContentTypeOption } from "@/lib/orders";

const WRITE_KEYS = new Set([
  "seo-content",
  "blog-post",
  "article",
  "technical-article",
  "thought-leadership",
  "newsletter",
  "product-page",
  "whitepaper",
]);
const PR_KEYS = new Set(["personal-pr", "press-release", "interview"]);
const IMPROVE_KEYS = new Set(["editing", "rewriting"]);

function groupContentTypes(types: ContentTypeOption[]) {
  const write: ContentTypeOption[] = [];
  const pr: ContentTypeOption[] = [];
  const improve: ContentTypeOption[] = [];
  const comingSoon: ContentTypeOption[] = [];

  for (const type of types) {
    if (!type.isOrderable) {
      comingSoon.push(type);
      continue;
    }
    if (WRITE_KEYS.has(type.key) || /expert|thought/i.test(type.name)) {
      write.push(type);
    } else if (PR_KEYS.has(type.key) || /press|interview|personal pr/i.test(type.name)) {
      pr.push(type);
    } else if (IMPROVE_KEYS.has(type.key) || /edit|rewrit/i.test(type.name)) {
      improve.push(type);
    } else {
      write.push(type);
    }
  }

  return [
    { title: "Write", items: write },
    { title: "PR and interviews", items: pr },
    { title: "Improve existing content", items: improve },
    { title: "Coming soon", items: comingSoon },
  ].filter((group) => group.items.length > 0);
}

export default async function ClientNewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const [contentTypes, folders, orders, invoices] = await Promise.all([
    getContentTypeOptions({ includeInactive: true }),
    getClientFolders(user.profileId),
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const selectedType = contentTypes.find((item) => item.id === params.type) ?? null;
  const budget = getContentBudgetSnapshot(orders, invoices);
  const groups = groupContentTypes(contentTypes);

  return (
    <DashboardShell
      role="client"
      title="New order"
      description="Pick a content type, then fill in the brief. Every order is delivered within 72 hours."
      currentPath="/client/new-order"
      userName={user.fullName}
      tabs={
        selectedType
          ? [
              { label: "1 Choose type", href: "/client/new-order", active: false },
              {
                label: "2 Brief",
                href: `/client/new-order?type=${selectedType.id}`,
                active: true,
              },
            ]
          : [
              { label: "1 Choose type", href: "/client/new-order", active: true },
              { label: "2 Brief", href: "/client/new-order", active: false },
            ]
      }
    >
      <section id="new-order-flow" className="grid gap-6">
        {!selectedType ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              What do you need?
            </h2>
            <div className="mt-8 space-y-10">
              {groups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {group.title}
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((type) => {
                      const comingSoon = !type.isOrderable;
                      const cardClass = `relative rounded-[1.25rem] border px-5 py-5 text-left transition ${
                        comingSoon
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                          : "border-slate-200 bg-white hover:border-[#91B9D2] hover:bg-[#F3F8FB]"
                      }`;
                      const body = (
                        <>
                          {comingSoon ? (
                            <span className="mb-3 inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              Coming soon
                            </span>
                          ) : null}
                          <h3 className="text-lg font-semibold text-slate-950">{type.name}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-900">What you&apos;ll get:</span>{" "}
                            {type.whatYouGet}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-900">Perfect for:</span>{" "}
                            {type.perfectFor}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-slate-500">Price</span>
                            <span className="font-semibold text-slate-900">{type.priceLabel}</span>
                          </div>
                        </>
                      );

                      return comingSoon ? (
                        <div aria-disabled className={cardClass} key={type.id}>
                          {body}
                        </div>
                      ) : (
                        <Link className={cardClass} href={`/client/new-order?type=${type.id}`} key={type.id}>
                          {body}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : selectedType.isOrderable ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Your brief: {selectedType.name}
              </h2>
              <Link className="text-sm font-semibold text-slate-600 underline" href="/client/new-order">
                {selectedType.name} · Change
              </Link>
            </div>
            <OrderForm
              budgetRemainingCents={Math.round(budget.remaining * 100)}
              contentTypes={contentTypes}
              folders={folders}
              hideContentTypeSelect
              presetContentTypeId={selectedType.id}
            />
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-orange-200 bg-orange-50 p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {selectedType.name} is coming soon
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">
              This service isn&apos;t open for ordering yet. Choose one of the live types for now.
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
