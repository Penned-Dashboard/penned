import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  clientStatusLabel,
  resolveWorkflowStatus,
  teamStatusLabel,
  type WorkflowStatus,
} from "@/lib/order-workflow";

export type TeamOrderRow = {
  id: string;
  title: string;
  clientLabel: string;
  agencyName: string;
  contentType: string;
  tier: string;
  language: string;
  words: number;
  delivery: string;
  priceCents: number;
  writerName: string | null;
  writerId: string | null;
  editorId: string | null;
  /** What the client typed in "Preferred writer" on the order form. */
  preferredWriter: string;
  dueLabel: string;
  dbStatus: string;
  workflowStatus: WorkflowStatus;
  teamStatus: string;
  clientStatus: string;
  createdAt: string;
};

function formatDue(date: string | null) {
  if (!date) return "Due within 72 hours of acceptance";
  // Date-only values (the client's optional due date) have no time to show.
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
      new Date(date),
    );
  }
  const text = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(new Date(date));
  return `${text} UK time`;
}

export async function getTeamOrders(filters?: {
  workflowStatuses?: WorkflowStatus[];
  limit?: number;
}): Promise<TeamOrderRow[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("orders")
    .select(
      "id, title, client_label, status, workflow_status, priority, language, word_count, budget_cents, service_tier, due_date, client_due_at, created_at, writer_id, editor_id, intake_details, content_types(name), profiles!orders_client_id_fkey(full_name, company_name)",
    )
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  const { data, error } = await query;
  if (error || !data) {
    // Fallback without workflow_status / join aliases if migration not applied yet.
    const fallback = await supabase
      .from("orders")
      .select(
        "id, title, client_label, status, priority, language, word_count, budget_cents, service_tier, due_date, created_at, writer_id, content_types(name)",
      )
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 100);
    if (fallback.error || !fallback.data) return [];
    return fallback.data.map((order) => mapTeamOrder(order as Record<string, unknown>));
  }

  const rows = data.map((order) => mapTeamOrder(order as Record<string, unknown>));
  if (filters?.workflowStatuses?.length) {
    return rows.filter((row) => filters.workflowStatuses!.includes(row.workflowStatus));
  }
  return rows;
}

function mapTeamOrder(order: Record<string, unknown>): TeamOrderRow {
  const contentTypes = order.content_types as { name?: string } | null;
  const clientProfile = order.profiles as { full_name?: string; company_name?: string } | null;
  const workflowStatus = resolveWorkflowStatus({
    dbStatus: String(order.status ?? ""),
    workflowStatus: order.workflow_status ? String(order.workflow_status) : null,
  });
  const tierRaw = String(order.service_tier ?? "on-demand");
  const tier =
    tierRaw === "rank" ? "Specialist" : tierRaw === "signature" ? "Signature" : "Standard";
  const deliveryRaw = String(order.priority ?? "standard");
  const delivery =
    deliveryRaw === "rush" ? "Rush" : deliveryRaw === "priority" ? "Priority" : "Standard";

  return {
    id: String(order.id),
    title: String(order.title ?? "Untitled"),
    clientLabel: String(order.client_label || clientProfile?.company_name || "Client"),
    agencyName: String(clientProfile?.company_name || clientProfile?.full_name || "Agency"),
    contentType: String(contentTypes?.name ?? "Content"),
    tier,
    language: String(order.language ?? "English"),
    words: Number(order.word_count ?? 0),
    delivery,
    priceCents: Number(order.budget_cents ?? 0),
    writerName: null,
    writerId: order.writer_id ? String(order.writer_id) : null,
    editorId: order.editor_id ? String(order.editor_id) : null,
    preferredWriter: String(
      ((order.intake_details as Record<string, unknown> | null) ?? {}).preferred_writer ?? "",
    ),
    dueLabel: formatDue(
      (order.client_due_at as string | null) ?? (order.due_date as string | null),
    ),
    dbStatus: String(order.status ?? ""),
    workflowStatus,
    teamStatus: teamStatusLabel({
      dbStatus: String(order.status ?? ""),
      workflowStatus: order.workflow_status ? String(order.workflow_status) : null,
    }),
    clientStatus: clientStatusLabel({
      dbStatus: String(order.status ?? ""),
      workflowStatus: order.workflow_status ? String(order.workflow_status) : null,
    }),
    createdAt: String(order.created_at ?? ""),
  };
}

export async function getTeamClients() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_name, created_at, is_uk_company, terms_accepted_at")
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, email, company_name, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .limit(100);
    return fallback.data ?? [];
  }
  return data;
}

export async function getTeamWriters() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, writer_tier, available, created_at")
    .eq("role", "writer")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "writer")
      .order("created_at", { ascending: false })
      .limit(100);
    return fallback.data ?? [];
  }
  return data;
}

export async function setOrderWorkflowStatus(orderId: string, workflowStatus: WorkflowStatus) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured." };

  const { dbStatusForWorkflow, timingChangesForStatus } = await import("@/lib/order-workflow");

  // Deadlines: start the clock when the brief is accepted, pause it while
  // we wait on the client. Never breaks the status change if it fails.
  let timing: Record<string, string | number | null> = {};
  const { data: current } = await supabase
    .from("orders")
    .select("priority, client_due_at, writer_due_at, pause_started_at, total_paused_minutes")
    .eq("id", orderId)
    .maybeSingle();
  if (current) {
    timing = timingChangesForStatus(current, workflowStatus);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      workflow_status: workflowStatus,
      status: dbStatusForWorkflow(workflowStatus),
      ...timing,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    // Retry without workflow_status if column missing.
    const retry = await supabase
      .from("orders")
      .update({
        status: dbStatusForWorkflow(workflowStatus),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (retry.error) return { ok: false as const, message: retry.error.message };
  }

  return { ok: true as const };
}

export async function getTeamEditors() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "editor")
    .order("full_name", { ascending: true })
    .limit(100);
  return data ?? [];
}

/** Stages where a writer can be assigned: brief accepted, or already being written (reassign). */
export const WRITER_ASSIGNABLE: WorkflowStatus[] = [
  "waiting_for_writer",
  "being_written",
  "changes_requested",
  "sent_back_by_editor",
];

/**
 * An account manager or admin gives an order to a writer. The brief must be
 * accepted first, so the deadline is already running. Reassigning keeps the
 * deadline.
 */
export async function assignOrderWriter(orderId: string, writerId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, workflow_status, writer_id, service_tier")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false as const, message: "Order not found." };

  const stage = resolveWorkflowStatus({
    dbStatus: String(order.status ?? ""),
    workflowStatus: order.workflow_status ? String(order.workflow_status) : null,
  });
  if (stage === "brief_check" || stage === "waiting_on_client") {
    return { ok: false as const, message: "Accept the brief first, so the delivery clock starts." };
  }
  if (!WRITER_ASSIGNABLE.includes(stage)) {
    return { ok: false as const, message: "This order is past the writing stage." };
  }
  if (String(order.writer_id ?? "") === writerId) {
    return { ok: true as const, message: "That writer is already on this order.", changed: false };
  }

  const { data: writer } = await supabase
    .from("profiles")
    .select("id, role, approval_status, writer_tier")
    .eq("id", writerId)
    .maybeSingle();
  const writerRow = writer as {
    role?: string;
    approval_status?: string | null;
    writer_tier?: string | null;
  } | null;
  if (!writerRow || writerRow.role !== "writer") {
    return { ok: false as const, message: "Choose a writer account." };
  }
  if (["pending", "paused"].includes(String(writerRow.approval_status ?? "approved").toLowerCase())) {
    return { ok: false as const, message: "That writer isn't approved yet." };
  }

  const serviceTier = String((order as { service_tier?: string | null }).service_tier ?? "on-demand");
  const writerTier = String(writerRow.writer_tier ?? "standard").toLowerCase();
  const writerIsSpecialist = writerTier === "specialist" || writerTier === "rank";
  const writerIsSignature = writerIsSpecialist || writerTier === "signature";
  if ((serviceTier === "rank" || serviceTier === "specialist") && !writerIsSpecialist) {
    return { ok: false as const, message: "Specialist jobs need a Specialist writer." };
  }
  if (serviceTier === "signature" && !writerIsSignature) {
    return { ok: false as const, message: "Signature jobs need a Signature or Specialist writer." };
  }

  const fresh = stage === "waiting_for_writer";
  const { error } = await supabase
    .from("orders")
    .update({
      writer_id: writerId,
      reserved_by: null,
      reserved_until: null,
      ...(fresh ? { status: "claimed", workflow_status: "being_written" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { ok: false as const, message: error.message };

  return {
    ok: true as const,
    message: order.writer_id ? "Writer changed and told." : "Writer assigned and told.",
    changed: true,
  };
}

/** An account manager or admin chooses the editor for an order. */
export async function assignOrderEditor(orderId: string, editorId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, workflow_status, editor_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false as const, message: "Order not found." };

  const stage = resolveWorkflowStatus({
    dbStatus: String(order.status ?? ""),
    workflowStatus: order.workflow_status ? String(order.workflow_status) : null,
  });
  if (stage === "completed" || stage === "cancelled") {
    return { ok: false as const, message: "This order is already finished." };
  }
  if (String(order.editor_id ?? "") === editorId) {
    return { ok: true as const, message: "That editor is already on this order.", changed: false };
  }

  const { data: editor } = await supabase.from("profiles").select("id, role").eq("id", editorId).maybeSingle();
  if (!editor || (editor as { role?: string }).role !== "editor") {
    return { ok: false as const, message: "Choose an editor account." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ editor_id: editorId, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false as const, message: error.message };

  return {
    ok: true as const,
    message: order.editor_id ? "Editor changed and told." : "Editor assigned and told.",
    changed: true,
  };
}
