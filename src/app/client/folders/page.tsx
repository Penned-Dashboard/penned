import { createClientFolderAction } from "@/app/client/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientFolders } from "@/lib/orders";

export default async function ClientFoldersPage({
  searchParams,
}: {
  searchParams: Promise<{ folderState?: string; folderMessage?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const folders = await getClientFolders(user.profileId);

  return (
    <DashboardShell
      role="client"
      title="Client Folders"
      description="Build shared end-client workspaces with reusable brand guidance, briefs, and compliance context."
      ctaLabel="Create New Order"
      ctaHref="/client/new-order"
      currentPath="/client/folders"
      userName={user.fullName}
    >
      {params.folderMessage ? (
        <div
          className={`rounded-[1.25rem] px-5 py-4 text-sm ${
            params.folderState === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {params.folderMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Existing folders"
          description="Each folder acts as a reusable client profile for future briefs and approvals."
        >
          {folders.length ? (
            <div className="space-y-4">
              {folders.map((folder) => (
                <article key={folder.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">{folder.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {folder.orderCount} linked order{folder.orderCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    {folder.briefTemplateUrl ? (
                      <a
                        className="button-secondary"
                        href={folder.briefTemplateUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open brief template
                      </a>
                    ) : null}
                  </div>
                  <dl className="mt-5 grid gap-3 md:grid-cols-2">
                    <Info label="Tone guide" value={folder.toneGuide || "Not set"} />
                    <Info label="Default word count" value={folder.defaultWordCount || "Not set"} />
                    <Info label="Target audience" value={folder.targetAudience || "Not set"} />
                    <Info label="Delivery preference" value={folder.deliveryPreference || "Not set"} />
                    <Info
                      label="Preferred content types"
                      value={folder.preferredContentTypes.length ? folder.preferredContentTypes.join(", ") : "Not set"}
                    />
                    <Info label="Compliance notes" value={folder.complianceNotes || "Not set"} />
                  </dl>
                  {folder.brandNotes ? (
                    <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                      {folder.brandNotes}
                    </div>
                  ) : null}
                  {folder.contentCalendarNotes ? (
                    <div className="mt-3 rounded-[1rem] border border-dashed border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500">
                      Content calendar: {folder.contentCalendarNotes}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-6 text-sm leading-7 text-slate-500">
              <p className="font-semibold text-slate-900">No client folders yet</p>
              <p className="mt-2">
                Create folders for the end clients your agency manages so each order can inherit brand
                notes, templates, and compliance guidance.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Create a folder"
          description="Store reusable brief links, tone guidance, delivery defaults, and account context."
        >
          <form action={createClientFolderAction} className="grid gap-4">
            <Field label="Client name" name="name" placeholder="Acme Robotics" required />
            <Field label="Brief template link" name="briefTemplateUrl" placeholder="https://docs.google.com/..." />
            <label>
              <span className="dashboard-label">Preferred content types</span>
              <div className="grid gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                {[
                  "SEO Content",
                  "Blog Post",
                  "Article",
                  "Technical Article",
                  "Expert Writing / Thought Leadership",
                  "Press Release",
                ].map((type) => (
                  <label key={type} className="flex items-start gap-3 text-sm text-slate-700">
                    <input className="mt-1" name="preferredContentTypes" type="checkbox" value={type} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </label>
            <Field label="Tone guide" name="toneGuide" placeholder="Clear, direct, and evidence-backed" />
            <Field label="Default word count" name="defaultWordCount" placeholder="1200" type="number" />
            <Field label="Target audience" name="targetAudience" placeholder="Technical buyers in mid-market SaaS" />
            <Field label="Delivery preference" name="deliveryPreference" placeholder="Google Doc + CMS-ready meta" />
            <Textarea
              label="Brand notes"
              name="brandNotes"
              placeholder="Voice, positioning, proof points, claims to avoid, and any evergreen brand guidance."
            />
            <Textarea
              label="Compliance notes"
              name="complianceNotes"
              placeholder="Forbidden claims, legal phrasing, regulated-industry cautions, or approval rules."
            />
            <Textarea
              label="Content calendar notes"
              name="contentCalendarNotes"
              placeholder="Upcoming launches, campaigns, or repeat monthly deliverables."
            />
            <button className="button-primary" type="submit">
              Create folder
            </button>
          </form>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span className="dashboard-label">{label}</span>
      <input className="dashboard-input" name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="dashboard-label">{label}</span>
      <textarea className="dashboard-input min-h-28" name={name} placeholder={placeholder} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
