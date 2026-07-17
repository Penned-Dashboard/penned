import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

const starterRows = [
  ["Client", "Content type", "Title", "Word count", "Priority"],
  ["Acme Robotics", "Blog Post", "Quarterly AI trends", "1200", "Standard"],
  ["Northstar Growth", "Press Release", "Product launch summary", "800", "Priority"],
  ["Verity Health", "Technical Article", "Security compliance guide", "1800", "Rush"],
];

export default async function ClientBulkOrdersPage() {
  const user = await requireRole("client");

  return (
    <DashboardShell
      role="client"
      title="Bulk Orders"
      description="Prepare multi-order batches in one place before we connect spreadsheet paste, CSV upload, and batch validation."
      ctaLabel="Back to orders"
      ctaHref="/client/orders"
      currentPath="/client/bulk-orders"
      userName={user.fullName}
    >
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <p className="text-sm leading-7 text-slate-600">
          This is the next major workflow from the feedback doc: spreadsheet-style batch ordering with validation, pricing preview, and one batch ID for multiple items.
        </p>
        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-slate-200">
          {starterRows.map((row, rowIndex) => (
            <div key={rowIndex} className={`grid grid-cols-5 ${rowIndex === 0 ? "bg-slate-50 text-slate-500" : "bg-white text-slate-700"}`}>
              {row.map((cell) => (
                <div key={cell} className="border-t border-slate-200 px-4 py-3 text-sm">{cell}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Paste rows from Google Sheets</div>
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Upload CSV / Excel</div>
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Validate missing fields + pricing</div>
        </div>
      </section>
    </DashboardShell>
  );
}
