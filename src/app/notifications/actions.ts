"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { markAllInAppNotificationsRead } from "@/lib/in-app-notifications";

export async function markAllNotificationsReadAction() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  await markAllInAppNotificationsRead(user.profileId);
  revalidatePath("/notifications");
  redirect("/notifications");
}
