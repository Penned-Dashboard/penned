import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamWriters } from "@/lib/team-data";

export default async function AdminWritersPage() {
  const user = await requireRole("admin");
  const writers = await getTeamWriters();

  return (
    <DashboardShell role="admin" title="Writers" description="" currentPath="/admin/writers" userName={user.fullName}>
      <SectionCard title="Writers" description="Approve pending writers, tiers, languages and photos from here next.">
        {writers.length === 0 ? (
          <p className="text-sm text-slate-500">No writers yet.</p>
        ) : (
          <ul className="space-y-3">
            {writers.map((writer) => (
              <li key={writer.id} className="rounded-[1.15rem] border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{writer.full_name}</p>
                <p className="text-sm text-slate-500">{writer.email}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
