"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { markAllInAppNotificationsRead, setInAppNotificationRead } from "@/lib/in-app-notifications";

/** Back to the list the person was on (All or Unread). */
function listPath(formData?: FormData) {
  return formData?.get("show") === "unread" ? "/notifications?show=unread" : "/notifications";
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  await markAllInAppNotificationsRead(user.profileId);
  revalidatePath("/notifications");
  redirect("/notifications");
}

/** Mark one notification read, or unread again so it stays on the bell. */
export async function setNotificationReadAction(formData: FormData) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const id = String(formData.get("id") ?? "");
  await setInAppNotificationRead(user.profileId, id, formData.get("read") === "yes");
  revalidatePath("/notifications");
  redirect(listPath(formData));
}
