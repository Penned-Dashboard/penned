import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { formatUsdFromCents, pricingSettings } from "@/lib/pricing";

export default async function AdminPricingPage() {
  const user = await requireRole("admin");

  return (
    <DashboardShell role="admin" title="Pricing & services" description="" currentPath="/admin/pricing" userName={user.fullName}>
      <SectionCard title="Writing levels" description="Changes apply to new orders only. Editable admin UI comes next — values live in the shared pricing module today.">
        <ul className="space-y-2 text-sm text-slate-600">
          <li>Standard {formatUsdFromCents(pricingSettings.standardCents)}/word</li>
          <li>Signature {formatUsdFromCents(pricingSettings.signatureCents)}/word</li>
          <li>Specialist from {formatUsdFromCents(pricingSettings.specialistCents)}/word</li>
          <li>Medical / legal {formatUsdFromCents(pricingSettings.specialistMedicalLegalCents)}/word</li>
          <li>Standard language surcharge {formatUsdFromCents(pricingSettings.standardLanguageSurchargeCents)}/word</li>
          <li>
            Rush +{formatUsdFromCents(pricingSettings.rushByTierCents.standard)} /{" "}
            {formatUsdFromCents(pricingSettings.rushByTierCents.signature)} /{" "}
            {formatUsdFromCents(pricingSettings.rushByTierCents.specialist)}
          </li>
          <li>UK VAT {pricingSettings.ukVatPercent}%</li>
        </ul>
      </SectionCard>
      <SectionCard title="Pay settings" description="Writer and editor pay grids (Standard pre-filled in handover).">
        <p className="text-sm text-slate-500">
          Standard writer: $0.015/word most types, $0.0225 for Expert Writing / Interview / Technical Article. Editor bands: $4–$15 by word count. Signature and Specialist cells left for Liam.
        </p>
      </SectionCard>
    </DashboardShell>
  );
}
