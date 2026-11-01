import { updateAdminProfileAction } from "@/app/admin/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getAdminProfiles } from "@/lib/orders";
import { roles } from "@/lib/types";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; notice?: string; noticeMessage?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const profiles = await getAdminProfiles();
  const filtered = query
    ? profiles.filter((profile) =>
        `${profile.fullName} ${profile.email} ${profile.role} ${profile.companyName}`.toLowerCase().includes(query),
      )
    : profiles;

  return (
    <DashboardShell
      role="admin"
      title="People"
      description="Create and edit client, writer, and admin accounts. Mark writers as Specialist so they can see Specialist jobs."
      ctaLabel="Back to dashboard"
      ctaHref="/admin"
      currentPath="/admin/people"
      userName={user.fullName}
      searchQuery={params.q}
      searchAction="/admin/people"
    >
      {params.noticeMessage ? (
        <p
          className={`rounded-[1rem] px-4 py-3 text-sm ${
            params.notice === "error" ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {params.noticeMessage}
        </p>
      ) : null}

      <SectionCard
        title="How admin edits work"
        description="Use this page for accounts. Pricing and new services are edited in code/catalog for now — we can add an admin UI next if you want."
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Change someone’s role (client / writer / admin) below.</li>
          <li>Set writer tier to Specialist for expert writers.</li>
          <li>New writer accounts can also be created via Sign up, then edited here.</li>
          <li>Content type prices live in the service catalog until an admin pricing screen is added.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Accounts" description={`${filtered.length} accounts`}>
        <div className="space-y-4">
          {filtered.map((profile) => (
            <form
              action={updateAdminProfileAction}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
              key={profile.id}
            >
              <input name="profileId" type="hidden" value={profile.id} />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950">{profile.fullName}</p>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                </div>
                <label className="lg:w-40">
                  <span className="dashboard-label">Role</span>
                  <select className="dashboard-input" defaultValue={profile.role} name="role">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lg:w-40">
                  <span className="dashboard-label">Writer tier</span>
                  <select className="dashboard-input" defaultValue={profile.writerTier} name="writerTier">
                    <option value="standard">standard</option>
                    <option value="specialist">specialist</option>
                  </select>
                </label>
                <label className="lg:w-52">
                  <span className="dashboard-label">Company</span>
                  <input className="dashboard-input" defaultValue={profile.companyName === "—" ? "" : profile.companyName} name="companyName" />
                </label>
                <button className="button-secondary" type="submit">
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
