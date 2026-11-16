/**
 * In-app notifications: the bell in the top bar and the /notifications page.
 * Rows live in public.notifications (profile_id, title, body, href, kind,
 * read_at, created_at). Only the server (service role) reads or writes them.
 *
 * What gets a notification is decided in notifications.ts and
 * notification-scheduler.ts: things that need the person's attention, never
 * confirmations of something they just did themselves.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  createdAt: string;
  read: boolean;
};

export type NewInAppNotification = {
  profileId: string;
  title: string;
  body?: string;
  /** A path inside the dashboard, for example /client/orders/123. */
  href: string;
  kind: string;
};

function clip(value: string, max: number) {
  const single = value.replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

/** Only ever link to a path inside the dashboard. */
export function safeNotificationHref(value: unknown) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/notifications";
}

/** Create notifications. Never throws: a failure must not break the action behind it. */
export async function addInAppNotifications(items: NewInAppNotification[]) {
  const supabase = createServerSupabaseClient();
  const seen = new Set<string>();
  const rows = items
    .filter((item) => {
      const key = `${item.profileId}|${item.kind}|${item.href}|${item.title}`;
      if (!item.profileId || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      profile_id: item.profileId,
      title: clip(item.title, 120),
      body: clip(item.body ?? "", 200),
      href: safeNotificationHref(item.href),
      kind: item.kind,
    }));
  if (!supabase || !rows.length) return;

  try {
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) console.error("notifications insert failed", error.message);
  } catch (error) {
    console.error("notifications insert failed", error instanceof Error ? error.message : error);
  }
}

function toItem(row: Record<string, unknown>): InAppNotification {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    href: safeNotificationHref(row.href),
    kind: String(row.kind ?? ""),
    createdAt: String(row.created_at ?? ""),
    read: Boolean(row.read_at),
  };
}

export async function listInAppNotifications(
  profileId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
): Promise<InAppNotification[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId) return [];
  let query = supabase
    .from("notifications")
    .select("id, title, body, href, kind, read_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 10);
  if (options.unreadOnly) query = query.is("read_at", null);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toItem);
}

export async function countUnreadInAppNotifications(profileId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);
  return count ?? 0;
}

/** Marks one notification read and returns where it points. Only the owner's rows match. */
export async function openInAppNotification(profileId: string, id: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId || !id) return null;
  const { data } = await supabase
    .from("notifications")
    .select("id, href, read_at")
    .eq("id", id)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) return null;
  if (!data.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("profile_id", profileId);
  }
  return safeNotificationHref(data.href);
}

export async function markAllInAppNotificationsRead(profileId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .is("read_at", null);
}

/**
 * The person has dealt with something (approved a draft, resubmitted, …), so
 * anything still unread that points at it is cleared for them.
 */
export async function resolveInAppNotifications(profileId: string, href: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId || !href) return;
  try {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("profile_id", profileId)
      .eq("href", href)
      .is("read_at", null);
  } catch (error) {
    // Never let the bell break the action (or the email) behind it.
    console.error("notifications resolve failed", error instanceof Error ? error.message : error);
  }
}
