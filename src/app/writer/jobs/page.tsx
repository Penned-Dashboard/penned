import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { CountdownBadge, DataTable, EmptyState, Notice, StatusBadge, Td, type NoticeParams } from "@/components/writer-ui";
import { requireRole } from "@/lib/auth";
import { getWriterJobs } from "@/lib/orders";
import { WRITER_STATUS_FILTERS, hoursUntil } from "@/lib/writer-status";

const FINISHED = ["approved", "paid", "cancelled"];

export default async function WriterMyJobsPage({
  searchParams,
}: {
  searchParams: Promise<NoticeParams & { q?: string; status?: string; client?: string }>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const jobs = await getWriterJobs(user.profileId);
  const query = params.q?.trim().toLowerCase() ?? "";
  const clients = [...new Set(jobs.map((job) => job.client))].sort((a, b) => a.localeCompare(b));
  const statusFilter = WRITER_STATUS_FILTERS.find((item) => item.key === params.status)?.key;
  const clientFilter = clients.includes(params.client ?? "") ? params.client : undefined;

  const filtered = jobs
    .filter((job) => (statusFilter ? job.status.key === statusFilter : true))
    .filter((job) => (clientFilter ? job.client === clientFilter : true))
    .filter((job) => (query ? `${job.title} ${job.client} ${job.category}`.toLowerCase().includes(query) : true))
    .sort((a, b) => {
      // Unfinished work first (soonest deadline), then finished work by most recent update.
      const aDone = FINISHED.includes(a.status.key);
      const bDone = FINISHED.includes(b.status.key);
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (!aDone) {
        return (hoursUntil(a.dueDate) ?? Number.POSITIVE_INFINITY) - (hoursUntil(b.dueDate) ?? Number.POSITIVE_INFINITY);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return (
    <DashboardShell
      role="writer"
      title="My Jobs"
      description="Every job you have taken on, from not started through paid."
      ctaLabel="Find more jobs"
      ctaHref="/writer/marketplace"
      currentPath="/writer/jobs"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/writer/jobs"
    >
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />

      <SectionCard title="Filters" description={`${filtered.length} of ${jobs.length} jobs shown.`}>
        <form action="/writer/jobs" className="grid gap-4 md:grid-cols-3" method="get">
          <label>
            <span className="dashboard-label">Search</span>
            <input className="dashboard-input" defaultValue={params.q} name="q" placeholder="Title, client, type" type="search" />
          </label>
          <label>
            <span className="dashboard-label">Status</span>
            <select className="dashboard-input" defaultValue={statusFilter ?? ""} name="status">
              <option value="">All statuses</option>
              {WRITER_STATUS_FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="dashboard-label">Client</span>
            <select className="dashboard-input" defaultValue={clientFilter ?? ""} name="client">
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 md:col-span-3">
            <button className="button-primary" type="submit">
              Apply
            </button>
            {statusFilter || clientFilter || query ? (
              <a className="button-secondary" href="/writer/jobs">
                Reset
              </a>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Jobs" description="Open a job for the brief, style guide, attachments, and review thread.">
        {filtered.length ? (
          <DataTable headers={["Client", "Title", "Word count", "Pay", "Due", "Status"]}>
            {filtered.map((job) => {
              const finished = FINISHED.includes(job.status.key) || job.status.key === "in_review";

              return (
                <tr key={job.id}>
                  <Td className="font-medium text-slate-700">{job.client}</Td>
                  <Td>
                    <Link className="font-semibold text-slate-950 hover:underline" href={`/writer/orders/${job.id}`}>
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{job.category}</p>
                  </Td>
                  <Td>{job.wordCount ? job.wordCount.toLocaleString("en-US") : "—"}</Td>
                  <Td className="font-medium text-slate-900">{job.pay}</Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      {finished ? null : <CountdownBadge dueDate={job.dueDate} />}
                      <span className="text-xs text-slate-500">{job.deadline}</span>
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={job.status} />
                  </Td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <EmptyState
            title={jobs.length ? "No jobs match these filters" : "No jobs yet"}
            body={
              jobs.length
                ? "Adjust or reset the filters to see more of your work."
                : "Claim a job from the marketplace and it will show up here."
            }
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
