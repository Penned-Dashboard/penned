import { ClientSettingsWorkspace } from "@/components/client-settings-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function ClientSettingsPage() {
  const user = await requireRole("client");

  return (
    <DashboardShell
      role="client"
      title="Client Settings"
      description="Manage workspace identity, team access, billing contacts, and approval controls."
      ctaLabel="Back to dashboard"
      ctaHref="/client"
      currentPath="/client/settings"
      userName={user.fullName}
    >
      <ClientSettingsWorkspace email={user.email} fullName={user.fullName} />
    </DashboardShell>
  );
}
