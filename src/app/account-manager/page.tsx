import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getTeamOrders } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export default async function AccountManagerTodayPage() {
  const user = await requireRole("account_manager");
  const orders = await getTeamOrders({ limit: 80 });
  const briefs = orders.filter((o) => o.workflowStatus === "brief_check");
  const waiting = orders.filter((o) => o.workflowStatus === "waiting_on_client");
  const writing = orders.filter((o) =>
    ["waiting_for_writer", "being_written", "with_editor", "changes_requested"].includes(o.workflowStatus),
  );

  const groups = [
    { title: "Briefs to check", items: briefs, href: `${rolePath("account_manager")}/briefs` },
    { title: "Waiting on the client", items: waiting, href: `${rolePath("account_manager")}/briefs` },
    { title: "In progress", items: writing, href: `${rolePath("account_manager")}/orders` },
  ];

  return (
    <DashboardShell
      role="account_manager"
      title="Today"
      description=""
      currentPath={rolePath("account_manager")}
      userName={user.fullName}
    >
      {groups.every((g) => g.items.length === 0) ? (
        <SectionCard title="Today" description="">
          <p className="text-sm text-slate-600">All your clients are on track.</p>
        </SectionCard>
      ) : null}
      <div className="grid gap-4">
        {groups.map((group) => (
          <SectionCard
            key={group.title}
            description={`${group.items.length} item${group.items.length === 1 ? "" : "s"}`}
            title={group.title}
          >
            {group.items.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here.</p>
            ) : (
              <ul className="space-y-3">
                {group.items.slice(0, 6).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="text-slate-500">
                        {item.agencyName} · {item.clientLabel} · {item.teamStatus}
                      </p>
                    </div>
                    <Link className="button-secondary" href={group.href}>
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        This week at a glance: {orders.length} orders visible ·{" "}
        {orders.filter((o) => o.workflowStatus === "completed").length} completed in this list.
      </p>
    </DashboardShell>
  );
}
