"use server";

import { redirect } from "next/navigation";
import {
  acceptSubmission,
  addSubmissionComment,
  createBulkOrders,
  createClientFolder,
  createOrder,
  requestRevision,
  seedWorkspaceReviewData,
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
    clientLabel: String(formData.get("clientLabel") ?? ""),
    clientFolderId: String(formData.get("clientFolderId") ?? ""),
    title: String(formData.get("title") ?? ""),
    contentTypeId: String(formData.get("contentTypeId") ?? ""),
    serviceTier: String(formData.get("serviceTier") ?? "") === "rank" ? "rank" : "on-demand",
    language: String(formData.get("language") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    toneOfVoice: String(formData.get("toneOfVoice") ?? ""),
    targetKeywords: String(formData.get("targetKeywords") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    wordCount: Number(formData.get("wordCount") ?? "0"),
    priority,
    primaryCta: String(formData.get("primaryCta") ?? ""),
    referenceLinks: String(formData.get("referenceLinks") ?? ""),
    brief: String(formData.get("brief") ?? ""),
    serviceFields: collectServiceFields(formData),
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

export async function loadSampleClientOrdersAction() {
  const result = await seedWorkspaceReviewData();
  const params = new URLSearchParams({
    sampleState: result.ok ? "success" : "error",
    sampleMessage: result.message,
  });

  redirect(`/client?${params.toString()}#orders`);
}

export async function submitBulkOrdersAction(payload: {
  paymentSource: string;
  rows: {
    client: string;
    contentType: string;
    tier: "on-demand" | "rank";
    title: string;
    wordCount: number;
    language: string;
    keywords: string;
    folderId: string;
  }[];
}) {
  return createBulkOrders(payload.rows, payload.paymentSource);
}

export async function createClientFolderAction(formData: FormData) {
  const result = await createClientFolder({
    name: String(formData.get("name") ?? ""),
    briefTemplateUrl: String(formData.get("briefTemplateUrl") ?? ""),
    brandNotes: String(formData.get("brandNotes") ?? ""),
    toneGuide: String(formData.get("toneGuide") ?? ""),
    preferredContentTypes: formData
      .getAll("preferredContentTypes")
      .map((value) => String(value).trim())
      .filter(Boolean),
    defaultWordCount: String(formData.get("defaultWordCount") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    complianceNotes: String(formData.get("complianceNotes") ?? ""),
    deliveryPreference: String(formData.get("deliveryPreference") ?? ""),
    contentCalendarNotes: String(formData.get("contentCalendarNotes") ?? ""),
  });

  const params = new URLSearchParams({
    folderState: result.ok ? "success" : "error",
    folderMessage: result.message,
  });
  redirect(`/client/folders?${params.toString()}`);
}

function collectServiceFields(formData: FormData) {
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("serviceField__")) {
      continue;
    }

    const normalizedKey = key.replace("serviceField__", "");
    const nextValue = stringifyFormValue(value);
    if (!nextValue) {
      continue;
    }
    fields[normalizedKey] = fields[normalizedKey]
      ? `${fields[normalizedKey]}, ${nextValue}`
      : nextValue;
  }

  const supportingFiles = formData
    .getAll("supportingFiles")
    .map(stringifyFormValue)
    .filter(Boolean);
  if (supportingFiles.length) {
    fields.supporting_files = supportingFiles.join(", ");
  }

  return fields;
}

function stringifyFormValue(value: FormDataEntryValue) {
  if (value instanceof File) {
    return value.name.trim();
  }

  const text = String(value ?? "").trim();
  return text === "[object File]" ? "" : text;
}
