"use server";

import { redirect } from "next/navigation";
import { isRole } from "@/lib/types";
import { approvePayout, refundOrderToClientBudget, updateAdminProfile } from "@/lib/orders";

export async function approvePayoutAction(formData: FormData) {
  const payoutRequestId = String(formData.get("payoutRequestId") ?? "");
  await approvePayout(payoutRequestId);
}

export async function refundOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const result = await refundOrderToClientBudget(orderId);
  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    noticeMessage: result.message,
  });
  redirect(`/admin/orders/${orderId}?${params.toString()}`);
}

export async function updateAdminProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const roleValue = String(formData.get("role") ?? "");
  const writerTierValue = String(formData.get("writerTier") ?? "standard");
  const companyName = String(formData.get("companyName") ?? "");

  if (!profileId || !isRole(roleValue)) {
    redirect("/admin/people?notice=error&noticeMessage=Missing+account+details.");
  }

  const result = await updateAdminProfile({
    profileId,
    role: roleValue,
    writerTier: writerTierValue === "specialist" ? "specialist" : "standard",
    companyName,
  });

  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    noticeMessage: result.message,
  });
  redirect(`/admin/people?${params.toString()}`);
}
