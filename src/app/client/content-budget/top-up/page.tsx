import { ContentBudgetTopUp } from "@/components/content-budget-top-up";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getContentBudgetSnapshot } from "@/lib/content-budget";
import { getClientOrders, getInvoices } from "@/lib/orders";

export default async function ContentBudgetTopUpPage() {
  const user = await requireRole("client");
  const [orders, invoices] = await Promise.all([
    getClientOrders(user.profileId),
    getInvoices(user.profileId),
  ]);
  const snapshot = getContentBudgetSnapshot(orders, invoices);

  return (
    <DashboardShell
      role="client"
      title="Add to your content budget"
      description="Top up at the standard rate, or prepay a larger Managed amount to unlock a discount on every eligible order."
      ctaLabel="Back to content budget"
      ctaHref="/client/content-budget"
      currentPath="/client/content-budget/top-up"
      userName={user.fullName}
    >
      <ContentBudgetTopUp priorityState={snapshot.priorityState} />
    </DashboardShell>
  );
}
