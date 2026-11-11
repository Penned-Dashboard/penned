import Link from "next/link";
import { acceptBriefAction, askClientQuestionAction } from "@/app/account-manager/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamOrders } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerBriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ asked?: string }>;
}) {
  const user = await requireRole("account_manager");
  const params = await searchParams;
  const briefs = (await getTeamOrders({ limit: 100 })).filter(
    (o) => o.workflowStatus === "brief_check" || o.workflowStatus === "waiting_on_client",
  );

  return (
    <DashboardShell
      role="account_manager"
      title="Briefs to check"
      description=""
      currentPath={`${rolePath("account_manager")}/briefs`}
      userName={user.fullName}
    >
      {params.asked ? (
        <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Question sent. The client deadline is paused until they reply.
        </p>
      ) : null}
      <SectionCard title="New briefs" description="Oldest first. Accept starts the 72-hour clock.">
        {briefs.length === 0 ? (
          <p className="text-sm text-slate-500">No new briefs.</p>
        ) : (
          <div className="space-y-4">
            {briefs.map((brief) => (
              <article key={brief.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{brief.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {brief.agencyName} · {brief.clientLabel} · {brief.contentType} · {brief.tier} ·{" "}
                      {brief.language} · {brief.words.toLocaleString()} words · {brief.delivery}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {brief.teamStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={acceptBriefAction}>
                      <input name="orderId" type="hidden" value={brief.id} />
                      <button className="button-primary" type="submit">
                        Accept brief
                      </button>
                    </form>
                    <form action={askClientQuestionAction}>
                      <input name="orderId" type="hidden" value={brief.id} />
                      <button className="button-secondary" type="submit">
                        Ask the client a question
                      </button>
                    </form>
                    <Link className="button-secondary" href={`/admin/orders/${brief.id}`}>
                      Open order
                    </Link>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Before you accept: industry questions answered · materials attached · key requirements clear
                </p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
