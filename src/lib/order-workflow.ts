/**
 * Shared order workflow — Liam team handover (How an order moves).
 * Maps DB statuses + optional workflow_status to client and team labels.
 */

export const WORKFLOW_STATUSES = [
  "brief_check",
  "waiting_on_client",
  "waiting_for_writer",
  "being_written",
  "with_editor",
  "in_review",
  "changes_requested",
  "waiting_for_approval",
  "completed",
  "cancelled",
  "sent_back_by_editor",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<WorkflowStatus, string> = {
  brief_check: "Checking your brief",
  waiting_on_client: "We have a question",
  waiting_for_writer: "Finding your writer",
  being_written: "Being written",
  with_editor: "With our editor",
  in_review: "Ready for your review",
  changes_requested: "Changes in progress",
  waiting_for_approval: "Waiting for approval",
  completed: "Approved",
  cancelled: "Cancelled",
  sent_back_by_editor: "Changes in progress",
};

export const TEAM_STATUS_LABELS: Record<WorkflowStatus, string> = {
  brief_check: "Brief check",
  waiting_on_client: "Waiting on client",
  waiting_for_writer: "Waiting for a writer",
  being_written: "Being written",
  with_editor: "With Editor",
  in_review: "In review",
  changes_requested: "Changes requested",
  waiting_for_approval: "Waiting for approval",
  completed: "Completed",
  cancelled: "Cancelled",
  sent_back_by_editor: "Sent back by editor",
};

const STATUS_PILL_CLASS: Record<WorkflowStatus, string> = {
  brief_check: "bg-sky-50 text-sky-800 border-sky-200",
  waiting_on_client: "bg-amber-50 text-amber-900 border-amber-200",
  waiting_for_writer: "bg-indigo-50 text-indigo-800 border-indigo-200",
  being_written: "bg-blue-50 text-blue-800 border-blue-200",
  with_editor: "bg-violet-50 text-violet-800 border-violet-200",
  in_review: "bg-orange-50 text-orange-900 border-orange-200",
  changes_requested: "bg-rose-50 text-rose-800 border-rose-200",
  waiting_for_approval: "bg-yellow-50 text-yellow-900 border-yellow-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  sent_back_by_editor: "bg-rose-50 text-rose-800 border-rose-200",
};

export function isWorkflowStatus(value: string | null | undefined): value is WorkflowStatus {
  return Boolean(value && (WORKFLOW_STATUSES as readonly string[]).includes(value));
}

/** Infer Liam workflow status from DB enum + optional workflow_status column. */
export function resolveWorkflowStatus({
  dbStatus,
  workflowStatus,
}: {
  dbStatus?: string | null;
  workflowStatus?: string | null;
}): WorkflowStatus {
  if (isWorkflowStatus(workflowStatus)) return workflowStatus;

  const status = (dbStatus ?? "").toLowerCase();
  if (status === "cancelled") return "cancelled";
  if (status === "accepted") return "completed";
  if (status === "revision_requested") return "changes_requested";
  if (status === "in_review") return "in_review";
  if (status === "submitted" || status === "resubmitted") return "with_editor";
  if (status === "claimed") return "being_written";
  if (status === "open" || status === "draft") return "brief_check";
  return "brief_check";
}

export function clientStatusLabel(input: {
  dbStatus?: string | null;
  workflowStatus?: string | null;
}) {
  return CLIENT_STATUS_LABELS[resolveWorkflowStatus(input)];
}

export function teamStatusLabel(input: {
  dbStatus?: string | null;
  workflowStatus?: string | null;
}) {
  return TEAM_STATUS_LABELS[resolveWorkflowStatus(input)];
}

export function statusPillClass(input: {
  dbStatus?: string | null;
  workflowStatus?: string | null;
}) {
  return STATUS_PILL_CLASS[resolveWorkflowStatus(input)];
}

/** Closest legacy DB enum when setting a workflow status. */
export function dbStatusForWorkflow(status: WorkflowStatus): string {
  switch (status) {
    case "brief_check":
    case "waiting_on_client":
    case "waiting_for_writer":
      return "open";
    case "being_written":
    case "sent_back_by_editor":
      return "claimed";
    case "with_editor":
      return "submitted";
    case "in_review":
    case "waiting_for_approval":
      return "in_review";
    case "changes_requested":
      return "revision_requested";
    case "completed":
      return "accepted";
    case "cancelled":
      return "cancelled";
    default:
      return "open";
  }
}

export const EDITING_WINDOW_HOURS = 6;
export const STANDARD_DELIVERY_HOURS = 72;
export const RUSH_DELIVERY_HOURS = 48;

export function deliveryHoursFor(priority?: string | null) {
  return priority === "rush" ? RUSH_DELIVERY_HOURS : STANDARD_DELIVERY_HOURS;
}

export function writerDeadlineFromClientDue(clientDueAt: Date) {
  return new Date(clientDueAt.getTime() - EDITING_WINDOW_HOURS * 60 * 60 * 1000);
}
