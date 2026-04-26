"use server";

import {
  acceptSubmission,
  addSubmissionComment,
  createOrder,
  requestRevision,
} from "@/lib/orders";
import {
  initialOrderFormState,
  type OrderFormState,
} from "@/lib/order-schema";

export async function submitOrderAction(
  _previousState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const priorityValue = String(formData.get("priority") ?? "");
  const priority =
    priorityValue === "standard" || priorityValue === "priority" || priorityValue === "rush"
      ? priorityValue
      : "standard";

  const result = await createOrder({
    title: String(formData.get("title") ?? ""),
    contentTypeId: String(formData.get("contentTypeId") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    toneOfVoice: String(formData.get("toneOfVoice") ?? ""),
    targetKeywords: String(formData.get("targetKeywords") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    wordCount: Number(formData.get("wordCount") ?? "0"),
    priority,
    primaryCta: String(formData.get("primaryCta") ?? ""),
    referenceLinks: String(formData.get("referenceLinks") ?? ""),
    brief: String(formData.get("brief") ?? ""),
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      errors: result.errors,
    };
  }

  return {
    ...initialOrderFormState,
    success: true,
    message: result.message,
  };
}

export async function requestRevisionAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "");
  await requestRevision(orderId, submissionId, feedback);
}

export async function acceptSubmissionAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  await acceptSubmission(orderId, submissionId);
}

export async function addSubmissionCommentAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const body = String(formData.get("body") ?? "");
  await addSubmissionComment(submissionId, body);
}
