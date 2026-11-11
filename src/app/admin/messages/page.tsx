import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const user = await requireRole("admin");
  return (
    <DashboardShell role="admin" title="Messages" description="" currentPath="/admin/messages" userName={user.fullName}>
      <SectionCard title="Messages" description="">
        <p className="text-sm text-slate-500">Client messages across all accounts. Empty until Help-page messaging is live.</p>
      </SectionCard>
    </DashboardShell>
  );
}
