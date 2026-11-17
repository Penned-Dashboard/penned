import Link from "next/link";
import { markAllNotificationsReadAction } from "@/app/notifications/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { NotificationList } from "@/components/notification-list";
import { requireAppUser } from "@/lib/auth";
import { countUnreadInAppNotifications, listInAppNotifications } from "@/lib/in-app-notifications";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const MAX_PAGES = 10;

/** Everything the bell has shown this person, newest first, 50 at a time. */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; pages?: string }>;
}) {
  const user = await requireAppUser();
  const params = await searchParams;
  const unreadOnly = params.show === "unread";
  const pages = Math.min(Math.max(Number.parseInt(params.pages ?? "1", 10) || 1, 1), MAX_PAGES);
  const limit = pages * PAGE_SIZE;
  const [items, unread] = await Promise.all([
    listInAppNotifications(user.profileId, { limit, unreadOnly }),
    countUnreadInAppNotifications(user.profileId),
  ]);
  const olderHref =
    items.length === limit && pages < MAX_PAGES
      ? `/notifications?${unreadOnly ? "show=unread&" : ""}pages=${pages + 1}`
      : null;

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
          <form action={markAllNotificationsReadAction} className="mb-5">
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
          <>
            <NotificationList items={items} unreadOnly={unreadOnly} />
            {olderHref ? (
              <div className="mt-5 text-center">
                <Link className="button-secondary" href={olderHref} scroll={false}>
                  Show older
                </Link>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
