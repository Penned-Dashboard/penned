import { startEditingAction } from "@/app/editor/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamOrders } from "@/lib/team-data";

export default async function EditorQueuePage() {
  const user = await requireRole("editor");
  const queue = (await getTeamOrders({ limit: 100 })).filter(
    (o) => o.workflowStatus === "with_editor" || o.dbStatus === "submitted",
  );

  return (
    <DashboardShell role="editor" title="Edit queue" description="" currentPath="/editor" userName={user.fullName}>
      <SectionCard title="Waiting for an edit" description="Soonest client deadline first.">
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing waiting for an edit.</p>
        ) : (
          <div className="space-y-3">
            {queue.map((job) => (
              <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{job.title}</p>
                  <p className="text-sm text-slate-500">
                    {job.clientLabel} · {job.tier} · {job.language} · {job.words.toLocaleString()} words · Edit by {job.dueLabel}
                  </p>
                </div>
                <form action={startEditingAction}>
                  <input name="orderId" type="hidden" value={job.id} />
                  <button className="button-primary" type="submit">
                    Start editing
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
