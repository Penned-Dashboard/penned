"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NotificationIcon } from "@/components/notification-icon";
import { relativeTime } from "@/lib/relative-time";

type Item = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  createdAt: string;
  read: boolean;
  /** Set when the line stands for several unread notifications of one kind. */
  count?: number;
};

const REFRESH_MS = 60_000;

/**
 * The bell in the top bar. Shows how many notifications are unread, and opens a
 * panel with the latest few. Opening one marks it read and goes to its page.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  /** On phones the panel spans the screen; this is where its top edge goes. */
  const [phoneTop, setPhoneTop] = useState<number | null>(null);
  /** Counts up each time something new arrives, to replay the short ring. */
  const [ring, setRing] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastUnread = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { unread?: number; items?: Item[] };
      const count = Number(data.unread ?? 0);
      // Ring only when the count goes up after the first load, never on page load.
      if (lastUnread.current !== null && count > lastUnread.current) setRing((value) => value + 1);
      lastUnread.current = count;
      setUnread(count);
      setItems(Array.isArray(data.items) ? data.items : []);
      setLoaded(true);
    } catch {
      // Offline or signed out: keep what we have.
    }
  }, []);

  // Refresh on load, once a minute while the tab is visible, and when it comes back into view.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  // Show the unread count in the browser tab, so it is noticed from another tab.
  // The page sets its own title as it loads and on navigation, so re-apply whenever it changes.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\+?\)\s/, "");
      const wanted = unread > 0 ? `(${unread > 9 ? "9+" : unread}) ${base}` : base;
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [unread]);

  // Keyboard users land in the panel when it opens.
  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((value) => {
      if (!value) {
        void load();
        const rect = button.current?.getBoundingClientRect();
        setPhoneTop(rect && window.innerWidth < 640 ? Math.round(rect.bottom + 8) : null);
      }
      return !value;
    });
  };

  const markAllRead = async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
    lastUnread.current = 0;
    try {
      await fetch("/api/notifications", { method: "POST" });
      // Reload so a folded line ("4 drafts ready") opens back out into its items.
      void load();
    } catch {
      void load();
    }
  };

  const badge = unread > 9 ? "9+" : String(unread);
  const label = unread === 0 ? "Notifications" : `Notifications, ${unread} unread`;

  return (
    <div className="relative" ref={wrapper}>
      <button
        aria-controls="notification-panel"
        aria-expanded={open}
        aria-label={label}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(23,37,63,0.18)] bg-white text-[var(--penned-navy)] shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--penned-navy)]"
        onClick={toggle}
        ref={button}
        title="Notifications"
        type="button"
      >
        <svg
          aria-hidden="true"
          className={ring ? "bell-ring" : undefined}
          fill="none"
          height="20"
          key={`bell-${ring}`}
          viewBox="0 0 24 24"
          width="20"
        >
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 2 6.5H4c.5-.5 2-2 2-6.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className={`${ring ? "badge-pop " : ""}absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--penned-lime)] px-1 text-[11px] font-bold leading-none text-[var(--penned-navy)]`}
            key={`badge-${ring}`}
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          aria-label="Notifications"
          className={`panel-in z-50 overflow-hidden rounded-2xl outline-none border border-[rgba(23,37,63,0.12)] bg-white shadow-[0_24px_60px_rgba(23,37,63,0.18)] ${
            phoneTop === null ? "absolute right-0 top-12 w-[22rem]" : "fixed inset-x-4"
          }`}
          id="notification-panel"
          ref={panel}
          role="dialog"
          tabIndex={-1}
          style={phoneTop === null ? undefined : { top: phoneTop }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--penned-navy)]">Notifications</p>
            {unread > 0 ? (
              <button
                className="text-xs font-semibold text-[var(--penned-navy)] underline underline-offset-2 hover:opacity-70"
                onClick={markAllRead}
                type="button"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {!loaded ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[var(--penned-navy)]">You&apos;re all caught up</p>
              <p className="mt-1 text-sm text-slate-500">
                We&apos;ll tell you here when something needs your attention.
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(24rem,60vh)] overflow-y-auto">
              {items.map((item) => (
                <li className="border-b border-slate-100 last:border-b-0" key={item.id}>
                  {/* A plain link: the route marks it read, then redirects to the right page.
                      A folded line (several of one kind) opens the unread list instead. */}
                  <a
                    className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none ${
                      item.read ? "" : "bg-[#f4f7fb]"
                    }`}
                    href={item.count ? item.href : `/api/notifications/open?id=${encodeURIComponent(item.id)}`}
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
                      <span className="mt-1 block text-xs text-slate-500">
                        {item.count ? `Latest ${relativeTime(item.createdAt).toLowerCase()}` : relativeTime(item.createdAt)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.read ? "bg-transparent" : "bg-[var(--penned-navy)]"
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <a
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-[var(--penned-navy)] hover:bg-slate-50"
            href="/notifications"
          >
            See all notifications
          </a>
        </div>
      ) : null}
    </div>
  );
}
