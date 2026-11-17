import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import {
  countUnreadInAppNotifications,
  listPanelNotifications,
  markAllInAppNotificationsRead,
} from "@/lib/in-app-notifications";

/** The bell: latest notifications and the unread count for whoever is logged in. */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [items, unread] = await Promise.all([
    listPanelNotifications(user.profileId),
    countUnreadInAppNotifications(user.profileId),
  ]);
  return NextResponse.json({ ok: true, unread, items });
}

/** "Mark all as read". */
export async function POST() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await markAllInAppNotificationsRead(user.profileId);
  return NextResponse.json({ ok: true, unread: 0 });
}
