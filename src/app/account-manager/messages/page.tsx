import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function Page() {
  const user = await requireRole("account_manager");
  return (
    <DashboardShell
      role="account_manager"
      title="Messages"
      description=""
      currentPath={`${rolePath("account_manager")}/messages`}
      userName={user.fullName}
    >
      <SectionCard title="Messages" description="">
        <p className="text-sm text-slate-500">No messages waiting.</p>
        <p className="mt-3 text-xs text-slate-400">
          Wired for the Google Docs / conversation scan next. Reviewers can use Test as role to walk the layout now.
        </p>
      </SectionCard>
    </DashboardShell>
  );
}
