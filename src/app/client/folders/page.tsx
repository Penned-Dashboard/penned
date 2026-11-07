import { ClientFoldersWorkspace } from "@/components/client-folders-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientFolders } from "@/lib/orders";

export default async function ClientFoldersPage({
  searchParams,
}: {
  searchParams: Promise<{ folderState?: string; folderMessage?: string; create?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const folders = await getClientFolders(user.profileId);

  return (
    <DashboardShell
      role="client"
      title="Client folders"
      description=""
      currentPath="/client/folders"
      userName={user.fullName}
    >
      <ClientFoldersWorkspace
        createMode={params.create === "1"}
        folders={folders}
        message={params.folderMessage}
        messageState={params.folderState}
      />
    </DashboardShell>
  );
}
