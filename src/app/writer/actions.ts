"use server";

import { redirect } from "next/navigation";
import {
  claimOrder,
  markJobInProgress,
  requestPayout,
  reserveOrder,
  saveWriterSettings,
  seedWorkspaceReviewData,
  submitDraft,
} from "@/lib/orders";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  type NotificationPrefs,
} from "@/lib/writer-status";

function redirectWithNotice(path: string, ok: boolean, message: string): never {
  const [base, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("notice", ok ? "success" : "error");
  params.set("noticeMessage", message);
  redirect(`${base}?${params.toString()}`);
}

/** Only allow redirects back into the writer area. */
function safeReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/writer") && !path.startsWith("//") ? path : fallback;
}

export async function reserveOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"), "/writer/marketplace");
  const result = await reserveOrder(orderId);
  redirectWithNotice(returnTo, result.ok, result.message);
}

export async function claimOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"), "/writer/marketplace");
  const result = await claimOrder(orderId);

  if (result.ok) {
    redirectWithNotice("/writer/assigned", true, result.message);
  }

  redirectWithNotice(returnTo, false, result.message);
}

export async function markJobInProgressAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await markJobInProgress(orderId);
  redirectWithNotice(`/writer/orders/${orderId}`, result.ok, result.message);
}

export async function submitDraftAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const googleDocUrl = String(formData.get("googleDocUrl") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const result = await submitDraft(orderId, googleDocUrl, notes);
  redirectWithNotice(`/writer/orders/${orderId}`, result.ok, result.message);
}

export async function requestPayoutAction(formData: FormData) {
  const amount = Number(formData.get("amount") ?? "0");
  const result = await requestPayout(amount);
  redirectWithNotice("/writer/earnings", result.ok, result.message);
}

export async function updateWriterSettingsAction(formData: FormData) {
  const notificationPrefs: NotificationPrefs = {};

  for (const event of NOTIFICATION_EVENTS) {
    notificationPrefs[event.key] = { email: false, inApp: false };
    for (const channel of NOTIFICATION_CHANNELS) {
      notificationPrefs[event.key][channel.key] = formData.get(`notif__${event.key}__${channel.key}`) === "on";
    }
  }

  const result = await saveWriterSettings({
    fullName: String(formData.get("fullName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    nicheTags: String(formData.get("nicheTags") ?? ""),
    available: formData.get("available") === "on",
    paymentInfo: String(formData.get("paymentInfo") ?? ""),
    taxInfo: String(formData.get("taxInfo") ?? ""),
    notificationPrefs,
  });

  redirectWithNotice("/writer/settings", result.ok, result.message);
}

export async function loadSampleWriterOrdersAction() {
  const result = await seedWorkspaceReviewData();
  const params = new URLSearchParams({
    sampleState: result.ok ? "success" : "error",
    sampleMessage: result.message,
  });

  redirect(`/writer?${params.toString()}`);
}
