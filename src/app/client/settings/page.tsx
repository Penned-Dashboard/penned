import { ClientSettingsWorkspace } from "@/components/client-settings-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function ClientSettingsPage() {
  const user = await requireRole("client");

  return (
    <DashboardShell
      role="client"
      title="Settings"
      description=""
      currentPath="/client/settings"
      userName={user.fullName}
    >
      <ClientSettingsWorkspace email={user.email} fullName={user.fullName} />
    </DashboardShell>
  );
}
