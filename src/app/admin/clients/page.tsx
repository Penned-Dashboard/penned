import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamClients } from "@/lib/team-data";

export default async function AdminClientsPage() {
  const user = await requireRole("admin");
  const clients = await getTeamClients();

  return (
    <DashboardShell role="admin" title="Clients" description="" currentPath="/admin/clients" userName={user.fullName}>
      <SectionCard title="Client accounts" description="Company, owner, terms accepted, UK VAT flag.">
        {clients.length === 0 ? (
          <p className="text-sm text-slate-500">No client accounts yet.</p>
        ) : (
          <ul className="space-y-3">
            {clients.map((client) => (
              <li key={client.id} className="rounded-[1.15rem] border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{client.company_name || client.full_name}</p>
                <p className="text-sm text-slate-500">
                  {client.full_name} · {client.email}
                  {"is_uk_company" in client && client.is_uk_company ? " · UK VAT" : ""}
                  {"terms_accepted_at" in client && client.terms_accepted_at ? " · Terms accepted" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
