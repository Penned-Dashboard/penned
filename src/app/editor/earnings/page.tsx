import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function EditorEarningsPage() {
  const user = await requireRole("editor");
  return (
    <DashboardShell role="editor" title="Earnings" description="" currentPath="/editor/earnings" userName={user.fullName}>
      <SectionCard title="Get paid" description="Editors are paid once per order when the client approves.">
        <p className="text-sm text-slate-500">
          Standard editor bands: $4 / $6 / $8 / $10 / $15 by word count. Signature and Specialist rates are set in admin Pricing & services.
        </p>
        <p className="mt-3 text-sm text-slate-500">Nothing to withdraw yet.</p>
      </SectionCard>
    </DashboardShell>
  );
}
