import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const user = await requireRole("admin");

  return (
    <DashboardShell
      role="admin"
      title="Admin Settings"
      description="Platform-level controls, operational defaults, and internal access notes."
      ctaLabel="Back to dashboard"
      ctaHref="/admin"
      currentPath="/admin/settings"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Admin Profile"
          description="The internal account currently managing platform operations."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={user.fullName} />
            <InfoBlock label="Email" value={user.email} />
            <InfoBlock label="Role" value="Admin" />
            <InfoBlock label="Access scope" value="Orders, payouts, catalog" />
          </div>
        </SectionCard>

        <SectionCard
          title="Operational Defaults"
          description="Current rules used across the MVP workflow."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <PreferenceRow label="Order intake" value="Live client self-serve" />
            <PreferenceRow label="Writer claims" value="Self-claim marketplace" />
            <PreferenceRow label="Payout approvals" value="Manual admin approval" />
            <PreferenceRow label="Billing sync" value="Stripe webhooks pending" />
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
