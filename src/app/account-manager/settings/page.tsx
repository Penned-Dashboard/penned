import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/account-manager";
import { requireRole } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function AccountManagerSettingsPage() {
  const user = await requireRole("account_manager");

  return (
    <DashboardShell
      role="account_manager"
      title="Settings"
      description=""
      currentPath={`${rolePath("account_manager")}/settings`}
      userName={user.fullName}
    >
      <SectionCard title="Profile" description="Name and photo shown to your clients on Help.">
        <p className="text-sm text-slate-600">
          Signed in as <span className="font-semibold">{user.fullName}</span> ({user.email}).
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Launch default manager card: {DEFAULT_ACCOUNT_MANAGER.name}. Photo pending from Liam.
        </p>
      </SectionCard>
      <SectionCard title="Away" description="">
        <p className="text-sm text-slate-500">
          Away mode will route messages, briefs and flags to admins. Toggle ships with notification prefs next.
        </p>
      </SectionCard>
    </DashboardShell>
  );
}
