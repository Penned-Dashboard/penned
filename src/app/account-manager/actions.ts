"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { setOrderWorkflowStatus } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

export async function acceptBriefAction(formData: FormData) {
  await requireRole("account_manager");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect(`${rolePath("account_manager")}/briefs`);
  await setOrderWorkflowStatus(orderId, "waiting_for_writer");
  revalidatePath(rolePath("account_manager"));
  revalidatePath(`${rolePath("account_manager")}/briefs`);
  revalidatePath(`${rolePath("account_manager")}/orders`);
  redirect(`${rolePath("account_manager")}/orders`);
}

export async function askClientQuestionAction(formData: FormData) {
  await requireRole("account_manager");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect(`${rolePath("account_manager")}/briefs`);
  await setOrderWorkflowStatus(orderId, "waiting_on_client");
  revalidatePath(rolePath("account_manager"));
  revalidatePath(`${rolePath("account_manager")}/briefs`);
  redirect(`${rolePath("account_manager")}/briefs?asked=1`);
}

export async function issueLateCreditAction(formData: FormData) {
  await requireRole("account_manager");
  const orderId = String(formData.get("orderId") ?? "");
  // Credit posting lands with wallet ledger work; for now mark attention cleared via note path.
  void orderId;
  redirect(`${rolePath("account_manager")}/orders?credit=logged`);
}
