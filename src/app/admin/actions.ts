"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRole } from "@/lib/types";
import { approvePayout, refundOrderToClientBudget, updateAdminProfile } from "@/lib/orders";
import { assignOrderToWriter } from "@/lib/team-data";

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

export async function assignWriterAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const writerId = String(formData.get("writerId") ?? "");
  const result = await assignOrderToWriter(orderId, writerId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account-manager/orders");
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
    writerTier:
      writerTierValue === "specialist" ? "specialist" : writerTierValue === "signature" ? "signature" : "standard",
    companyName,
  });

  const params = new URLSearchParams({
    notice: result.ok ? "success" : "error",
    noticeMessage: result.message,
  });
  redirect(`/admin/people?${params.toString()}`);
}
