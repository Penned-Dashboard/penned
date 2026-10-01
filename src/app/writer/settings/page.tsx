import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { Notice, type NoticeParams } from "@/components/writer-ui";
import { updateWriterSettingsAction } from "@/app/writer/actions";
import { requireRole } from "@/lib/auth";
import { getWriterSettings, getWriterWallet } from "@/lib/orders";
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from "@/lib/writer-status";

export default async function WriterSettingsPage({
  searchParams,
}: {
  searchParams: Promise<NoticeParams>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const [settings, wallet] = await Promise.all([
    getWriterSettings(user.profileId, { fullName: user.fullName, email: user.email }),
    getWriterWallet(user.profileId),
  ]);

  return (
    <DashboardShell
      role="writer"
      title="Writer Settings"
      description="Manage your profile, availability, payout details, and notifications."
      ctaLabel="Back to dashboard"
      ctaHref="/writer"
      currentPath="/writer/settings"
      userName={user.fullName}
      searchAction="/writer/settings"
    >
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />
      {settings.schemaReady ? null : (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Profile settings are not available yet. Run supabase/writer-p0-upgrade.sql in Supabase, then reload.
        </div>
      )}

      <form action={updateWriterSettingsAction} className="grid gap-4">
        <section className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Profile" description="How you appear to the Penned team.">
            <div className="space-y-4">
              <label>
                <span className="dashboard-label">Full name</span>
                <input className="dashboard-input" defaultValue={settings.fullName} name="fullName" required />
                <span className="mt-2 block text-xs text-slate-500">
                  Your name in the page header refreshes the next time you sign in.
                </span>
              </label>
              <label>
                <span className="dashboard-label">Email</span>
                <input className="dashboard-input" disabled value={settings.email} readOnly />
              </label>
              <label>
                <span className="dashboard-label">Bio</span>
                <textarea
                  className="dashboard-input min-h-28"
                  defaultValue={settings.bio}
                  maxLength={1000}
                  name="bio"
                  placeholder="A short intro: experience, specialties, and the work you do best."
                />
              </label>
              <label>
                <span className="dashboard-label">Niche tags</span>
                <input
                  className="dashboard-input"
                  defaultValue={settings.nicheTags.join(", ")}
                  name="nicheTags"
                  placeholder="SaaS, healthcare, fintech"
                />
                <span className="mt-2 block text-xs text-slate-500">Comma separated, up to 12.</span>
              </label>
            </div>
          </SectionCard>

          <div className="grid gap-4 content-start">
            <SectionCard title="Availability" description="Let the team know whether you can take on more work.">
              <label className="flex items-center justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white p-4">
                <span>
                  <span className="block font-medium text-slate-800">Available for new jobs</span>
                  <span className="block text-sm text-slate-500">Turn off while you are at capacity.</span>
                </span>
                <input
                  className="h-5 w-5 accent-blue-600"
                  defaultChecked={settings.available}
                  name="available"
                  type="checkbox"
                />
              </label>
            </SectionCard>

            <SectionCard
              title="Payment & tax"
              description={`Used by the team to send payouts. Available balance: ${wallet.available}.`}
            >
              <div className="space-y-4">
                <label>
                  <span className="dashboard-label">Payment details</span>
                  <textarea
                    className="dashboard-input min-h-24"
                    defaultValue={settings.paymentInfo}
                    name="paymentInfo"
                    placeholder="PayPal email, or bank transfer instructions"
                  />
                </label>
                <label>
                  <span className="dashboard-label">Tax information</span>
                  <textarea
                    className="dashboard-input min-h-24"
                    defaultValue={settings.taxInfo}
                    name="taxInfo"
                    placeholder="Tax ID / VAT number and billing country"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Avoid full bank or social security numbers here. Share those through the secure payout process.
                </p>
              </div>
            </SectionCard>
          </div>
        </section>

        <SectionCard title="Notifications" description="Choose how you hear about each event.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="pb-3 pr-4">Event</th>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <th key={channel.key} className="pb-3 px-4 text-center">
                      {channel.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_EVENTS.map((event) => (
                  <tr key={event.key} className="border-t border-slate-100">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-800">{event.label}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                    </td>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel.key} className="px-4 py-3 text-center">
                        <input
                          aria-label={`${event.label} via ${channel.label}`}
                          className="h-4 w-4 accent-blue-600"
                          defaultChecked={settings.notificationPrefs[event.key]?.[channel.key] ?? true}
                          name={`notif__${event.key}__${channel.key}`}
                          type="checkbox"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div>
          <button className="button-primary" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
