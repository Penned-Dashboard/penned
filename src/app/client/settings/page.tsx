import { ClientSettingsWorkspace } from "@/components/client-settings-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { readClientEmailPrefs } from "@/lib/email-prefs";
import { getClientBillingFlags } from "@/lib/orders";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ClientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; message?: string; emails?: string }>;
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

  // Read separately so a missing column never hides the billing details.
  let notificationPrefs: unknown = null;
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", user.profileId)
      .maybeSingle();
    notificationPrefs = data?.notification_prefs ?? null;
  }
  const emailPrefs = readClientEmailPrefs(notificationPrefs);
  const emailNotice =
    params.emails === "saved"
      ? "Email settings saved."
      : params.emails === "error"
        ? "Could not save your email settings. Please try again."
        : null;

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
        emailEnabled={emailPrefs.enabled}
        emailFrequency={emailPrefs.frequency}
        emailNotice={emailNotice}
        fullName={user.fullName}
        isUkCompany={billing.isUkCompany}
        vatNumber={vatNumber}
      />
    </DashboardShell>
  );
}
