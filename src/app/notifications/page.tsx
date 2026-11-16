import Link from "next/link";
import { markAllNotificationsReadAction } from "@/app/notifications/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireAppUser } from "@/lib/auth";
import { countUnreadInAppNotifications, listInAppNotifications } from "@/lib/in-app-notifications";
import { relativeTime } from "@/lib/relative-time";

export const dynamic = "force-dynamic";

/** Everything the bell has shown this person: the latest 100, newest first. */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const user = await requireAppUser();
  const params = await searchParams;
  const unreadOnly = params.show === "unread";
  const [items, unread] = await Promise.all([
    listInAppNotifications(user.profileId, { limit: 100, unreadOnly }),
    countUnreadInAppNotifications(user.profileId),
  ]);

  return (
    <DashboardShell
      currentPath="/notifications"
      role={user.role}
      tabs={[
        { label: "All", href: "/notifications", active: !unreadOnly },
        {
          label: unread ? `Unread (${unread})` : "Unread",
          href: "/notifications?show=unread",
          active: unreadOnly,
        },
      ]}
      title="Notifications"
      userName={user.fullName}
    >
      <SectionCard
        description="Things that need your attention. Opening one marks it as read."
        title={unreadOnly ? "Unread" : "All notifications"}
      >
        {unread > 0 ? (
          <form action={markAllNotificationsReadAction} className="mb-4">
            <button className="button-secondary" type="submit">
              Mark all as read
            </button>
          </form>
        ) : null}

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-[var(--penned-navy)]">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-slate-500">
              {unreadOnly ? (
                <>
                  Nothing unread. <Link className="underline" href="/notifications">See all notifications</Link>
                </>
              ) : (
                "We'll tell you here when something needs your attention."
              )}
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white">
            {items.map((item) => (
              <li className="border-b border-slate-100 last:border-b-0" key={item.id}>
                <a
                  className={`flex gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${item.read ? "" : "bg-[#f4f7fb]"}`}
                  href={`/api/notifications/open?id=${encodeURIComponent(item.id)}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? "bg-transparent" : "bg-[var(--penned-navy)]"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-5 text-[var(--penned-navy)] ${
                        item.read ? "font-medium" : "font-semibold"
                      }`}
                    >
                      {item.read ? null : <span className="sr-only">Unread: </span>}
                      {item.title}
                    </span>
                    {item.body ? (
                      <span className="mt-0.5 block text-sm leading-5 text-slate-600">{item.body}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{relativeTime(item.createdAt)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
