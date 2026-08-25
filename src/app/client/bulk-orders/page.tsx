import { BulkOrderWorkspace } from "@/components/bulk-order-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientFolders, getContentTypeOptions } from "@/lib/orders";

export default async function ClientBulkOrdersPage() {
  const user = await requireRole("client");
  const [contentTypes, folders] = await Promise.all([
    getContentTypeOptions({ includeInactive: true }),
    getClientFolders(user.profileId),
  ]);

  return (
    <DashboardShell
      role="client"
      title="Bulk Orders"
      description="Batch multiple content requests with spreadsheet-style prep, validation, and pricing visibility before submission."
      ctaLabel="Back to orders"
      ctaHref="/client/orders"
      currentPath="/client/bulk-orders"
      userName={user.fullName}
    >
      <BulkOrderWorkspace contentTypes={contentTypes} folders={folders} />
    </DashboardShell>
  );
}
