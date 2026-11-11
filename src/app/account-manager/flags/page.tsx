import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function Page() {
  const user = await requireRole("account_manager");
  return (
    <DashboardShell
      role="account_manager"
      title="Flags"
      description=""
      currentPath={`${rolePath("account_manager")}/flags`}
      userName={user.fullName}
    >
      <SectionCard title="Flags" description="">
        <p className="text-sm text-slate-500">Nothing flagged.</p>
        <p className="mt-3 text-xs text-slate-400">
          Wired for the Google Docs / conversation scan next. Reviewers can use Test as role to walk the layout now.
        </p>
      </SectionCard>
    </DashboardShell>
  );
}
