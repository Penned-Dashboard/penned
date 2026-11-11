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
  dueLabel: string;
  dbStatus: string;
  workflowStatus: WorkflowStatus;
  teamStatus: string;
  clientStatus: string;
  createdAt: string;
};

function formatDue(date: string | null) {
  if (!date) return "Due within 72 hours of acceptance";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
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
      "id, title, client_label, status, workflow_status, priority, language, word_count, budget_cents, service_tier, due_date, client_due_at, created_at, writer_id, content_types(name), profiles!orders_client_id_fkey(full_name, company_name)",
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

  const { dbStatusForWorkflow } = await import("@/lib/order-workflow");
  const { error } = await supabase
    .from("orders")
    .update({
      workflow_status: workflowStatus,
      status: dbStatusForWorkflow(workflowStatus),
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
