import { BulkOrderWorkspace } from "@/components/bulk-order-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientBillingFlags, getClientFolders, getContentTypeOptions } from "@/lib/orders";

export default async function ClientBulkOrdersPage() {
  const user = await requireRole("client");
  const [contentTypes, folders, billing] = await Promise.all([
    getContentTypeOptions({ includeInactive: true }),
    getClientFolders(user.profileId),
    getClientBillingFlags(user.profileId),
  ]);

  return (
    <DashboardShell
      role="client"
      title="Bulk orders"
      description="Order lots of pieces at once. Add them as rows, check the price, then submit them as one batch."
      currentPath="/client/bulk-orders"
      userName={user.fullName}
    >
      <BulkOrderWorkspace
        applyUkVat={billing.applyUkVat}
        contentTypes={contentTypes}
        folders={folders}
      />
    </DashboardShell>
  );
}
