import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamOrders } from "@/lib/team-data";

export default async function EditorDonePage() {
  const user = await requireRole("editor");
  const done = (await getTeamOrders({ limit: 100 })).filter(
    (o) => o.workflowStatus === "in_review" || o.workflowStatus === "completed",
  );

  return (
    <DashboardShell role="editor" title="Done" description="" currentPath="/editor/done" userName={user.fullName}>
      <SectionCard title="Approved edits" description="">
        {done.length === 0 ? (
          <p className="text-sm text-slate-500">Drafts you approve will show here.</p>
        ) : (
          <ul className="space-y-3">
            {done.map((job) => (
              <li key={job.id} className="rounded-[1.15rem] border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{job.title}</p>
                <p className="text-sm text-slate-500">{job.teamStatus} · Pay to be set</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
