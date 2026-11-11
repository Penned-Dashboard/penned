"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { setOrderWorkflowStatus } from "@/lib/team-data";

export async function startEditingAction(formData: FormData) {
  await requireRole("editor");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/editor");
  // Keep with_editor; "my edits" is tracked by claiming in UI for now.
  void orderId;
  redirect(`/editor/my-edits?started=${encodeURIComponent(orderId)}`);
}

export async function approveDraftAction(formData: FormData) {
  await requireRole("editor");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/editor");
  await setOrderWorkflowStatus(orderId, "in_review");
  revalidatePath("/editor");
  revalidatePath("/editor/done");
  redirect("/editor/done");
}

export async function sendBackToWriterAction(formData: FormData) {
  await requireRole("editor");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/editor");
  await setOrderWorkflowStatus(orderId, "sent_back_by_editor");
  revalidatePath("/editor");
  revalidatePath("/editor/my-edits");
  redirect("/editor/my-edits");
}
