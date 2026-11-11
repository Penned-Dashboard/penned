import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function EditorSettingsPage() {
  const user = await requireRole("editor");
  return (
    <DashboardShell role="editor" title="Settings" description="" currentPath="/editor/settings" userName={user.fullName}>
      <SectionCard title="Profile" description="Team-only name and photo. Clients never see editor names.">
        <p className="text-sm text-slate-600">
          {user.fullName} · {user.email}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Launch editor: Junise Lourens (senior for every tier and language). Admins set tiers/languages here later.
        </p>
      </SectionCard>
    </DashboardShell>
  );
}
