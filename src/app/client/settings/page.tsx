import { ClientSettingsWorkspace } from "@/components/client-settings-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientBillingFlags } from "@/lib/orders";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ClientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; message?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const billing = await getClientBillingFlags(user.profileId);
  const supabase = createServerSupabaseClient();
  let vatNumber = "";
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("vat_number")
      .eq("id", user.profileId)
      .maybeSingle();
    vatNumber = (data?.vat_number as string | null) ?? "";
  }

  const billingNotice =
    params.billing === "saved"
      ? "Billing details saved."
      : params.billing === "error"
        ? params.message || "Could not save billing details."
        : null;

  return (
    <DashboardShell
      role="client"
      title="Settings"
      description=""
      currentPath="/client/settings"
      userName={user.fullName}
    >
      <ClientSettingsWorkspace
        billingCountry={billing.billingCountry ?? ""}
        billingNotice={billingNotice}
        email={user.email}
        fullName={user.fullName}
        isUkCompany={billing.isUkCompany}
        vatNumber={vatNumber}
      />
    </DashboardShell>
  );
}
