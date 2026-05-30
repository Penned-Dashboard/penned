"use server";

import { redirect } from "next/navigation";
import { claimOrder, requestPayout, seedWorkspaceReviewData, submitDraft } from "@/lib/orders";

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

export async function loadSampleWriterOrdersAction() {
  const result = await seedWorkspaceReviewData();
  const params = new URLSearchParams({
    sampleState: result.ok ? "success" : "error",
    sampleMessage: result.message,
  });

  redirect(`/writer?${params.toString()}#job-marketplace`);
}
