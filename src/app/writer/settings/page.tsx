import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getWriterWallet } from "@/lib/orders";

export default async function WriterSettingsPage() {
  const user = await requireRole("writer");
  const wallet = await getWriterWallet(user.profileId);

  return (
    <DashboardShell
      role="writer"
      title="Writer Settings"
      description="Review your payout profile, preferred workflow, and workspace details."
      ctaLabel="Back to dashboard"
      ctaHref="/writer"
      currentPath="/writer/settings"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Writer Profile"
          description="Your core details as they appear in the Penned marketplace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={user.fullName} />
            <InfoBlock label="Email" value={user.email} />
            <InfoBlock label="Role" value="Writer" />
            <InfoBlock label="Available payout" value={wallet.available} />
          </div>
        </SectionCard>

        <SectionCard
          title="Work Preferences"
          description="Current defaults for assignment handling and delivery."
        >
          <div className="space-y-3 text-sm text-slate-600">
            <PreferenceRow label="Submission workflow" value="Google Doc + notes" />
            <PreferenceRow label="Revision handling" value="Threaded comments enabled" />
            <PreferenceRow label="Payout cadence" value="Manual request" />
            <PreferenceRow label="Status visibility" value="Live on dashboard" />
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
