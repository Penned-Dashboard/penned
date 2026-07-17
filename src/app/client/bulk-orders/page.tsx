import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

const starterRows = [
  ["Client", "Content type", "Tier", "Title", "Word count", "Language", "Status"],
  ["Acme Robotics", "SEO Content", "On-demand", "Quarterly AI trends", "1200", "English", "Ready"],
  ["Northstar Growth", "Press Release", "Rank", "Product launch summary", "800", "English", "Missing quote"],
  ["Verity Health", "Technical Article", "On-demand", "Security compliance guide", "1800", "English", "Ready"],
];

export default async function ClientBulkOrdersPage() {
  const user = await requireRole("client");

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
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Batch workflow"
          description="The recommended flow is add rows, validate the batch, preview pricing, choose payment source, then submit under one batch ID."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <StepCard title="1. Add rows" detail="Add rows manually, paste from Google Sheets, or upload CSV / Excel." />
            <StepCard title="2. Validate" detail="Flag missing word count, missing content type, duplicate title, or missing client folder." />
            <StepCard title="3. Price preview" detail="Show total orders, total words, tier mix, estimated total, wallet deduction, and invoice amount." />
            <StepCard title="4. Submit batch" detail="Create item-level orders under one parent batch ID for clear production tracking." />
          </div>
        </SectionCard>

        <SectionCard
          title="Quick actions"
          description="These are the highest-value bulk ordering actions called out in the feedback doc."
        >
          <div className="grid gap-3">
            <ActionCard title="Paste from Google Sheets" detail="Copy rows from an existing planning sheet and paste them directly into the dashboard table." />
            <ActionCard title="Upload CSV / Excel" detail="Bring structured content plans in without rebuilding them manually." />
            <ActionCard title="Validation screen" detail="Catch missing client folder, unsupported turnaround, or duplicate title issues before checkout." />
            <ActionCard title="Batch pricing preview" detail="Give agencies commercial visibility before committing the batch." />
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Starter batch preview"
        description="This shows the structure the real bulk table will follow as the paste and file-import layer is wired in."
      >
        <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
          {starterRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid grid-cols-7 ${
                rowIndex === 0 ? "bg-slate-50 text-slate-500" : "bg-white text-slate-700"
              }`}
            >
              {row.map((cell) => (
                <div key={`${rowIndex}-${cell}`} className="border-t border-slate-200 px-4 py-3 text-sm">
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Total orders" value="3" />
          <Metric label="Total words" value="3,800" />
          <Metric label="Estimated total" value="$246" />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}

function StepCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function ActionCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
