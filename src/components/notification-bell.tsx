"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/relative-time";

type Item = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
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
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { unread?: number; items?: Item[] };
      setUnread(Number(data.unread ?? 0));
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
    try {
      await fetch("/api/notifications", { method: "POST" });
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
        <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
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
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--penned-lime)] px-1 text-[11px] font-bold leading-none text-[var(--penned-navy)]"
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          aria-label="Notifications"
          className={`z-50 overflow-hidden rounded-2xl border border-[rgba(23,37,63,0.12)] bg-white shadow-[0_24px_60px_rgba(23,37,63,0.18)] ${
            phoneTop === null ? "absolute right-0 top-12 w-[22rem]" : "fixed inset-x-4"
          }`}
          id="notification-panel"
          role="dialog"
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
                  {/* A plain link: the route marks it read, then redirects to the right page. */}
                  <a
                    className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none ${
                      item.read ? "" : "bg-[#f4f7fb]"
                    }`}
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
                      <span className="mt-1 block text-xs text-slate-500">{relativeTime(item.createdAt)}</span>
                    </span>
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
