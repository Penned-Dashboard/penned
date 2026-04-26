"use server";

import { approvePayout } from "@/lib/orders";

export async function approvePayoutAction(formData: FormData) {
  const payoutRequestId = String(formData.get("payoutRequestId") ?? "");
  await approvePayout(payoutRequestId);
}
