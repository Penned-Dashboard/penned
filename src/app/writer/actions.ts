"use server";

import { claimOrder, requestPayout, submitDraft } from "@/lib/orders";

export async function claimOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  await claimOrder(orderId);
}

export async function submitDraftAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const googleDocUrl = String(formData.get("googleDocUrl") ?? "");
  const notes = String(formData.get("notes") ?? "");
  await submitDraft(orderId, googleDocUrl, notes);
}

export async function requestPayoutAction(formData: FormData) {
  const amount = Number(formData.get("amount") ?? "0");
  await requestPayout(amount);
}
