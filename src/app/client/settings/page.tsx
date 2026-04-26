import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function ClientSettingsPage() {
  const user = await requireRole("client");

  return (
    <DashboardShell
      role="client"
      title="Client Settings"
      description="Manage your workspace identity, billing contact, and review preferences."
      ctaLabel="Back to dashboard"
      ctaHref="/client"
      currentPath="/client/settings"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Workspace Profile"
          description="The core client information tied to your content orders."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={user.fullName} />
            <InfoBlock label="Email" value={user.email} />
            <InfoBlock label="Role" value="Client" />
            <InfoBlock label="Default workflow" value="Order, review, approve" />
          </div>
        </SectionCard>

        <SectionCard
          title="Review Preferences"
          description="Recommended defaults for your team’s delivery workflow."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <PreferenceRow label="Revision rounds" value="2 included" />
            <PreferenceRow label="Primary reviewer" value={user.fullName} />
            <PreferenceRow label="Approval notifications" value="Email summary enabled" />
            <PreferenceRow label="Billing contact" value={user.email} />
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-right text-slate-500">{value}</p>
    </div>
  );
}
