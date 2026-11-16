"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { notifyEditorAssigned, notifyWriterAssigned, queueNotification } from "@/lib/notifications";
import { assignOrderEditor, assignOrderWriter } from "@/lib/team-data";

/** Only send people back to the team pages they came from. */
function safeReturn(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return /^\/(admin|account-manager)(\/|$)/.test(path) && !path.startsWith("//") ? path : "/admin/orders";
}

function withNotice(path: string, ok: boolean, message: string) {
  const [base] = path.split("?");
  const params = new URLSearchParams({ notice: ok ? "success" : "error", noticeMessage: message });
  return `${base}?${params.toString()}`;
}

async function requireTeam() {
  const user = await getCurrentAppUser();
  if (!user || !["account_manager", "admin"].includes(user.role)) redirect("/sign-in");
  return user;
}

export async function assignWriterAction(formData: FormData) {
  await requireTeam();
  const orderId = String(formData.get("orderId") ?? "");
  const writerId = String(formData.get("writerId") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"));
  if (!orderId || !writerId) redirect(withNotice(returnTo, false, "Choose a writer first."));

  const result = await assignOrderWriter(orderId, writerId);
  if (result.ok && result.changed) queueNotification(() => notifyWriterAssigned(orderId));

  revalidatePath("/admin/orders");
  revalidatePath("/account-manager/orders");
  revalidatePath("/writer");
  redirect(withNotice(returnTo, result.ok, result.message));
}

export async function assignEditorAction(formData: FormData) {
  await requireTeam();
  const orderId = String(formData.get("orderId") ?? "");
  const editorId = String(formData.get("editorId") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"));
  if (!orderId || !editorId) redirect(withNotice(returnTo, false, "Choose an editor first."));

  const result = await assignOrderEditor(orderId, editorId);
  if (result.ok && result.changed) queueNotification(() => notifyEditorAssigned(orderId));

  revalidatePath("/admin/orders");
  revalidatePath("/account-manager/orders");
  revalidatePath("/editor");
  redirect(withNotice(returnTo, result.ok, result.message));
}
