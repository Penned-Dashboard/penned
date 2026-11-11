import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const user = await requireRole("admin");
  return (
    <DashboardShell role="admin" title="Flags" description="" currentPath="/admin/flags" userName={user.fullName}>
      <SectionCard title="Flags" description="">
        <p className="text-sm text-slate-500">Poaching / contact-detail flags from conversations and client doc comments.</p>
      </SectionCard>
    </DashboardShell>
  );
}
