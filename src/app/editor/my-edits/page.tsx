import { approveDraftAction, sendBackToWriterAction } from "@/app/editor/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamOrders } from "@/lib/team-data";

export default async function EditorMyEditsPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string }>;
}) {
  const user = await requireRole("editor");
  const params = await searchParams;
  const orders = await getTeamOrders({ limit: 100 });
  const mine = orders.filter(
    (o) => o.workflowStatus === "with_editor" || o.id === params.started,
  );

  return (
    <DashboardShell role="editor" title="My edits" description="" currentPath="/editor/my-edits" userName={user.fullName}>
      <SectionCard title="In progress" description="">
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500">You’re not editing anything right now.</p>
        ) : (
          <div className="space-y-4">
            {mine.map((job) => (
              <article key={job.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-lg font-semibold text-slate-950">{job.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {job.tier} · {job.language} · {job.words.toLocaleString()} words · {job.delivery} · Edit by {job.dueLabel}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Checklist: Matches brief · Edited for clarity · Proofread · Keywords natural · Tone matches guide
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={approveDraftAction}>
                    <input name="orderId" type="hidden" value={job.id} />
                    <button className="button-primary" type="submit">
                      Approve and send to client
                    </button>
                  </form>
                  <form action={sendBackToWriterAction}>
                    <input name="orderId" type="hidden" value={job.id} />
                    <button className="button-secondary" type="submit">
                      Send back to writer
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
