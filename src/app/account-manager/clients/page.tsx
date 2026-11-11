import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamClients } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerClientsPage() {
  const user = await requireRole("account_manager");
  const clients = await getTeamClients();

  return (
    <DashboardShell
      role="account_manager"
      title="My clients"
      description=""
      currentPath={`${rolePath("account_manager")}/clients`}
      userName={user.fullName}
    >
      <SectionCard title="Assigned clients" description="At launch Fairmay sees all clients until per-client assignment is filled in admin.">
        {clients.length === 0 ? (
          <p className="text-sm text-slate-500">No clients assigned to you yet.</p>
        ) : (
          <ul className="space-y-3">
            {clients.map((client) => (
              <li key={client.id} className="rounded-[1.15rem] border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{client.company_name || client.full_name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
