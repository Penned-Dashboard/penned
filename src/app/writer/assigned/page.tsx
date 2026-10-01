import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { CountdownBadge, DataTable, EmptyState, Notice, StatusBadge, Td, type NoticeParams } from "@/components/writer-ui";
import { requireRole } from "@/lib/auth";
import { getWriterAssignments } from "@/lib/orders";

export default async function WriterAssignedJobsPage({
  searchParams,
}: {
  searchParams: Promise<NoticeParams & { q?: string }>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const assignments = await getWriterAssignments(user.profileId);
  const jobs = query
    ? assignments.filter((job) => `${job.title} ${job.client} ${job.status.label}`.toLowerCase().includes(query))
    : assignments;

  return (
    <DashboardShell
      role="writer"
      title="Assigned Jobs"
      description="Jobs you have claimed that still need work, soonest deadline first."
      ctaLabel="Find more jobs"
      ctaHref="/writer/marketplace"
      currentPath="/writer/assigned"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/writer/assigned"
    >
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />
      <SectionCard
        title="To do"
        description="Open a job to read the brief, start work, and submit your Google Doc."
      >
        {jobs.length ? (
          <DataTable headers={["Client", "Title", "Word count", "Pay", "Due", "Status"]}>
            {jobs.map((job) => (
              <tr key={job.id}>
                <Td className="font-medium text-slate-700">{job.client}</Td>
                <Td>
                  <Link className="font-semibold text-slate-950 hover:underline" href={`/writer/orders/${job.id}`}>
                    {job.title}
                  </Link>
                </Td>
                <Td>{job.wordCount ? job.wordCount.toLocaleString("en-US") : "—"}</Td>
                <Td className="font-medium text-slate-900">{job.pay}</Td>
                <Td>
                  <div className="flex flex-col items-start gap-1">
                    <CountdownBadge dueDate={job.dueDate} />
                    <span className="text-xs text-slate-500">{job.deadline}</span>
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={job.status} />
                </Td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="No assigned jobs"
            body="Claim a job from the marketplace and it will appear here."
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
