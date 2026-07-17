import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

const teamRoles = [
  {
    name: "Owner",
    detail: "Billing, users, all clients, and all orders",
  },
  {
    name: "Account manager",
    detail: "Create orders, approve spend, and view assigned clients",
  },
  {
    name: "Content manager",
    detail: "Create briefs, submit orders, and request revisions",
  },
  {
    name: "Finance",
    detail: "View invoices, wallet activity, and statements only",
  },
  {
    name: "Viewer",
    detail: "Read-only access",
  },
];

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
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Workspace profile"
          description="Core account details tied to your content operations workspace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock label="Full name" value={user.fullName} />
            <InfoBlock label="Email" value={user.email} compact />
            <InfoBlock label="Role" value="Client" />
            <InfoBlock label="Default workflow" value="Order, review, approve" />
          </div>
        </SectionCard>

        <SectionCard
          title="Billing contact"
          description="Where invoices, payment notifications, and account terms are routed."
        >
          <div className="space-y-3">
            <PreferenceRow label="Primary billing contact" value={user.email} wrap />
            <PreferenceRow label="VAT / tax records" value="Stored with invoice exports" />
            <PreferenceRow label="Payment terms" value="Prepaid unless Priority Account is approved" />
            <PreferenceRow label="Account owner" value={user.fullName} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Invite a team member"
          description="Prepare shared access for larger agencies and internal approvers."
        >
          <form className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="dashboard-label">Email address</span>
              <input className="dashboard-input" placeholder="teammate@agency.com" type="email" />
            </label>
            <label>
              <span className="dashboard-label">Role</span>
              <select className="dashboard-input" defaultValue="Content manager">
                {teamRoles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button className="button-primary w-full" type="button">
                Send invite
              </button>
            </div>
          </form>
          <div className="mt-5 space-y-3">
            {teamRoles.map((role) => (
              <div key={role.name} className="dashboard-list-row">
                <p className="font-semibold text-slate-950">{role.name}</p>
                <p className="max-w-md text-right text-sm text-slate-500">{role.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Approval rules"
          description="Use lightweight controls to prevent junior team members from submitting large or sensitive work unchecked."
        >
          <div className="space-y-3">
            <RuleRow
              title="Require approval over £250"
              detail="Recommended for larger briefs or any order that crosses the spend threshold."
            />
            <RuleRow
              title="Require approval for the first order under a new client folder"
              detail="Helps senior team members confirm the initial setup before repeat work begins."
            />
            <RuleRow
              title="Require approval if wallet balance will fall below a set threshold"
              detail="Protects prepaid budgets from accidental depletion."
            />
            <RuleRow
              title="Require approval for rush fees"
              detail="Useful when turnaround speed changes commercial expectations."
            />
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function InfoBlock({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[1.15rem] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-2 text-lg font-semibold text-slate-950 ${compact ? "break-all" : ""}`}>{value}</p>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
  wrap = false,
}: {
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="font-medium text-slate-700">{label}</p>
      <p className={`text-right text-slate-500 ${wrap ? "break-all" : ""}`}>{value}</p>
    </div>
  );
}

function RuleRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
