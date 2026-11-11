import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamWriters } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerWritersPage() {
  const user = await requireRole("account_manager");
  const writers = await getTeamWriters();

  return (
    <DashboardShell
      role="account_manager"
      title="Writers"
      description=""
      currentPath={`${rolePath("account_manager")}/writers`}
      userName={user.fullName}
    >
      <SectionCard title="Approved writers you can assign" description="Read only. No pay information.">
        {writers.length === 0 ? (
          <p className="text-sm text-slate-500">No writers yet.</p>
        ) : (
          <ul className="space-y-3">
            {writers.map((writer) => {
              const tierRaw = "writer_tier" in writer ? String(writer.writer_tier ?? "") : "";
              const tier =
                tierRaw === "rank" || tierRaw === "specialist"
                  ? "Specialist"
                  : tierRaw === "signature"
                    ? "Signature"
                    : tierRaw
                      ? "Standard"
                      : "Tier to be set";
              return (
                <li key={writer.id} className="rounded-[1.15rem] border border-slate-200 px-4 py-3">
                  <p className="font-semibold text-slate-950">{writer.full_name}</p>
                  <p className="text-sm text-slate-500">
                    {tier} · {writer.email}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
