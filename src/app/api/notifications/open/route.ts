import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { openInAppNotification } from "@/lib/in-app-notifications";

/**
 * Opening a notification: mark it read, then go to the page it is about.
 * A plain link, so it also works in a new tab.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", url));

  const href = await openInAppNotification(user.profileId, url.searchParams.get("id") ?? "");
  return NextResponse.redirect(new URL(href ?? "/notifications", url));
}
