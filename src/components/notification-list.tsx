import { setNotificationReadAction } from "@/app/notifications/actions";
import { NotificationIcon } from "@/components/notification-icon";
import type { InAppNotification } from "@/lib/in-app-notifications";
import { groupByDay } from "@/lib/notification-display";
import { relativeTime } from "@/lib/relative-time";

/**
 * The full list on the notifications page, under Last 24 hours / This week / Older.
 * Opening an item marks it read; the small button marks one read or unread
 * without opening it.
 */
export function NotificationList({ items, unreadOnly }: { items: InAppNotification[]; unreadOnly: boolean }) {
  return (
    <div className="space-y-6">
      {groupByDay(items).map((section) => (
        <section key={section.heading}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{section.heading}</h3>
          <ul className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            {section.items.map((item) => (
              <li
                className={`flex flex-col border-b sm:flex-row sm:items-stretch border-slate-100 last:border-b-0 ${item.read ? "" : "bg-[#f4f7fb]"}`}
                key={item.id}
              >
                <a
                  className="flex min-w-0 flex-1 gap-3 px-4 py-3.5 hover:bg-slate-50"
                  href={`/api/notifications/open?id=${encodeURIComponent(item.id)}`}
                >
                  <NotificationIcon kind={item.kind} />
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
                    <span className="mt-1 block text-xs text-slate-500">{relativeTime(item.createdAt)}</span>
                  </span>
                </a>
                <form action={setNotificationReadAction} className="-mt-2 flex shrink-0 items-center gap-2 pb-3 pl-16 pr-4 sm:mt-0 sm:pb-0 sm:pl-0">
                  <input name="id" type="hidden" value={item.id} />
                  <input name="read" type="hidden" value={item.read ? "no" : "yes"} />
                  {unreadOnly ? <input name="show" type="hidden" value="unread" /> : null}
                  <button
                    className="rounded-full py-1 text-xs sm:px-2 font-semibold text-slate-500 underline-offset-2 hover:text-[var(--penned-navy)] hover:underline"
                    type="submit"
                  >
                    {item.read ? "Mark as unread" : "Mark as read"}
                  </button>
                  <span
                    aria-hidden="true"
                    className={`hidden h-2 w-2 rounded-full sm:block ${item.read ? "bg-transparent" : "bg-[var(--penned-navy)]"}`}
                  />
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
