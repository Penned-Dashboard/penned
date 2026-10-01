import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { WorkspaceAutoRefresh } from "@/components/workspace-auto-refresh";
import { CountdownBadge, EmptyState, Notice, type NoticeParams } from "@/components/writer-ui";
import { claimOrderAction, reserveOrderAction } from "@/app/writer/actions";
import { requireRole } from "@/lib/auth";
import {
  getWriterMarketplace,
  RESERVE_MINUTES,
  type MarketplaceFilters,
  type MarketplaceSort,
} from "@/lib/orders";
import { ASSUMED_WORDS_PER_HOUR, formatPayPerHour } from "@/lib/writer-status";

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "pay_desc", label: "Highest pay" },
  { value: "pay_hour_desc", label: "Highest est. pay / hour" },
  { value: "due_soon", label: "Due soonest" },
  { value: "words_asc", label: "Shortest first" },
  { value: "words_desc", label: "Longest first" },
];

const LENGTH_OPTIONS = [
  { value: "", label: "Any length" },
  { value: "short", label: "Short (< 800 words)" },
  { value: "medium", label: "Medium (800–1,500)" },
  { value: "long", label: "Long (1,500+)" },
];

type SearchParams = NoticeParams & {
  q?: string;
  category?: string;
  minPay?: string;
  length?: string;
  sort?: string;
};

export default async function WriterMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const sort = SORT_OPTIONS.find((option) => option.value === params.sort)?.value ?? "newest";
  const length =
    params.length === "short" || params.length === "medium" || params.length === "long" ? params.length : undefined;
  const minPay = Number(params.minPay);
  const filters: MarketplaceFilters = {
    q: params.q,
    category: params.category || undefined,
    minPayDollars: Number.isFinite(minPay) && minPay > 0 ? minPay : undefined,
    length,
    sort,
  };
  const { jobs, categories, totalOpen } = await getWriterMarketplace(user.profileId, filters);

  const returnParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ q: params.q, category: params.category, minPay: params.minPay, length, sort })) {
    if (value) returnParams.set(key, String(value));
  }
  const returnTo = `/writer/marketplace${returnParams.size ? `?${returnParams.toString()}` : ""}`;
  const hasFilters = Boolean(filters.q || filters.category || filters.minPayDollars || filters.length);

  return (
    <DashboardShell
      role="writer"
      title="Job Marketplace"
      description="Open jobs you can claim right now. The list refreshes automatically."
      ctaLabel="View assigned jobs"
      ctaHref="/writer/assigned"
      currentPath="/writer/marketplace"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/writer/marketplace"
    >
      <WorkspaceAutoRefresh intervalMs={25000} />
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />

      <SectionCard title="Filter & sort" description={`${jobs.length} of ${totalOpen} open jobs shown.`}>
        <form action="/writer/marketplace" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" method="get">
          <label className="xl:col-span-1">
            <span className="dashboard-label">Search</span>
            <input className="dashboard-input" defaultValue={params.q} name="q" placeholder="Title, client, industry" type="search" />
          </label>
          <label>
            <span className="dashboard-label">Category</span>
            <select className="dashboard-input" defaultValue={params.category ?? ""} name="category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="dashboard-label">Min pay ($)</span>
            <input className="dashboard-input" defaultValue={params.minPay} min="0" name="minPay" placeholder="0" step="1" type="number" />
          </label>
          <label>
            <span className="dashboard-label">Length</span>
            <select className="dashboard-input" defaultValue={length ?? ""} name="length">
              {LENGTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="dashboard-label">Sort by</span>
            <select className="dashboard-input" defaultValue={sort} name="sort">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-5">
            <button className="button-primary" type="submit">
              Apply
            </button>
            {hasFilters || sort !== "newest" ? (
              <a className="button-secondary" href="/writer/marketplace">
                Reset
              </a>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Open jobs"
        description={`Reserve a job to hold it for ${RESERVE_MINUTES} minutes, or claim it straight away. Est. pay/hour assumes ${ASSUMED_WORDS_PER_HOUR} words per hour.`}
      >
        {jobs.length ? (
          <div className="space-y-3">
            {jobs.map((job) => {
              const minutesLeft = job.reservedMinutesLeft;

              return (
                <div key={job.id} className="dashboard-list-row flex-col items-stretch gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950">{job.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {job.client} · {job.category} · {job.industry}
                    </p>
                    {job.reservedByMe && minutesLeft ? (
                      <p className="mt-2 text-xs font-semibold text-blue-700">
                        Held for you · about {minutesLeft} min left to confirm
                      </p>
                    ) : null}
                  </div>
                  <dl className="grid shrink-0 grid-cols-3 gap-4 text-sm lg:w-80">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.15em] text-slate-400">Words</dt>
                      <dd className="mt-1 font-medium text-slate-800">
                        {job.wordCount ? job.wordCount.toLocaleString("en-US") : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.15em] text-slate-400">Pay</dt>
                      <dd className="mt-1 font-medium text-slate-800">{job.pay}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.15em] text-slate-400">Est. / hr</dt>
                      <dd className="mt-1 font-medium text-slate-800">{formatPayPerHour(job.payPerHourCents)}</dd>
                    </div>
                  </dl>
                  <div className="flex shrink-0 flex-col items-start gap-1 lg:w-36">
                    <CountdownBadge dueDate={job.dueDate} />
                    <span className="text-xs text-slate-500">{job.turnaround}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {job.reservedByMe ? null : (
                      <form action={reserveOrderAction}>
                        <input name="orderId" type="hidden" value={job.id} />
                        <input name="returnTo" type="hidden" value={returnTo} />
                        <button className="button-secondary" type="submit">
                          Reserve
                        </button>
                      </form>
                    )}
                    <form action={claimOrderAction}>
                      <input name="orderId" type="hidden" value={job.id} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <button className={job.reservedByMe ? "button-primary" : "button-secondary"} type="submit">
                        {job.reservedByMe ? "Confirm claim" : "Claim"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={hasFilters ? "No jobs match these filters" : "No open jobs right now"}
            body={
              hasFilters
                ? "Try widening your filters or resetting them."
                : "New client orders appear here as soon as they enter the marketplace."
            }
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
