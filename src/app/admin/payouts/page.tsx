import { approvePayoutAction } from "@/app/admin/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getPayoutRequests } from "@/lib/orders";

export default async function AdminPayoutsPage() {
  const user = await requireRole("admin");
  const payouts = await getPayoutRequests();
  const pending = payouts.filter((p) => p.status.toLowerCase() === "pending");

  return (
    <DashboardShell role="admin" title="Payouts" description="" currentPath="/admin/payouts" userName={user.fullName}>
      <SectionCard title="To approve" description="">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No payout requests waiting.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-950">{payout.writer}</p>
                  <p className="text-sm text-slate-500">{payout.amount} · {payout.status}</p>
                </div>
                <form action={approvePayoutAction}>
                  <input name="payoutRequestId" type="hidden" value={payout.id} />
                  <button className="button-primary" type="submit">Approve</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
