import { revalidatePath } from "next/cache";
import { getCurrentAppUser } from "@/lib/auth";
import {
  getServiceByName,
  type ServiceDefinition,
} from "@/lib/content-catalog";
import {
  orderSchema,
  type OrderFormValues,
} from "@/lib/order-schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import {
  dueDateToDeadline,
  estimatePayPerHour,
  formatUsd,
  hoursUntil,
  mapWriterStatus,
  normalizeNotificationPrefs,
  type NotificationPrefs,
  type WriterStatus,
} from "@/lib/writer-status";

export {
  ASSUMED_WORDS_PER_HOUR,
  estimatePayPerHour,
  getCountdownTone,
  mapWriterStatus,
} from "@/lib/writer-status";

export type ContentTypeOption = {
  id: string;
  key: string;
  name: string;
  description: string;
  whatYouGet: string;
  perfectFor: string;
  priceLabel: string;
  turnaroundDays: number;
  basePriceCents: number;
  isOrderable: boolean;
  orderIndex: number;
  fields: ServiceDefinition["fields"];
};

export type ClientFolder = {
  id: string;
  name: string;
  briefTemplateUrl: string;
  brandNotes: string;
  toneGuide: string;
  preferredContentTypes: string[];
  defaultWordCount: string;
  targetAudience: string;
  complianceNotes: string;
  deliveryPreference: string;
  contentCalendarNotes: string;
  orderCount: number;
};

export type DashboardOrder = {
  id: string;
  name: string;
  clientLabel: string;
  contentType: string;
  writer: string;
  status: string;
  deadline: string;
};

export type ReviewQueueItem = {
  orderId: string;
  submissionId: string;
  title: string;
  clientLabel: string;
  writer: string;
  due: string;
  status: string;
};

export type MarketplaceOrder = {
  id: string;
  title: string;
  client: string;
  industry: string;
  category: string;
  wordCount: number | null;
  payCents: number;
  pay: string;
  /** Raw due_date value (YYYY-MM-DD) for countdown calculations. */
  dueDate: string | null;
  turnaround: string;
  status: string;
  createdAt: string;
  reservedByMe: boolean;
  reservedUntil: string | null;
  /** Minutes left on the viewer's own reservation, if any. */
  reservedMinutesLeft: number | null;
  payPerHourCents: number | null;
};

export type MarketplaceSort =
  | "newest"
  | "pay_desc"
  | "pay_hour_desc"
  | "due_soon"
  | "words_asc"
  | "words_desc";

export type MarketplaceFilters = {
  q?: string;
  category?: string;
  minPayDollars?: number;
  length?: "short" | "medium" | "long";
  sort?: MarketplaceSort;
};

export type MarketplaceResult = {
  jobs: MarketplaceOrder[];
  categories: string[];
  totalOpen: number;
};

export type WriterJob = {
  id: string;
  title: string;
  client: string;
  category: string;
  wordCount: number | null;
  payCents: number;
  pay: string;
  dueDate: string | null;
  deadline: string;
  status: WriterStatus;
  dbStatus: string;
  updatedAt: string;
};

export type SubmissionThreadComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type SubmissionVersion = {
  id: string;
  status: string;
  notes: string;
  googleDocUrl: string;
  submittedAt: string;
  version: number;
  comments: SubmissionThreadComment[];
};

export type ClientOrderDetail = {
  id: string;
  title: string;
  clientLabel: string;
  status: string;
  deadline: string;
  contentType: string;
  writer: string;
  targetAudience: string;
  toneOfVoice: string;
  targetKeywords: string[];
  wordCount: string;
  priority: string;
  primaryCta: string;
  referenceLinks: string[];
  brief: string;
  latestSubmission: SubmissionVersion | null;
};

export type WriterStyleGuide = {
  folderName: string;
  briefTemplateUrl: string;
  brandNotes: string;
  toneGuide: string;
  targetAudience: string;
  complianceNotes: string;
  deliveryPreference: string;
};

export type WriterOrderDetail = {
  id: string;
  title: string;
  client: string;
  contentType: string;
  /** Pragmatic P0 status label (see mapWriterStatus). */
  status: string;
  writerStatus: WriterStatus;
  dbStatus: string;
  deadline: string;
  /** Raw due_date value for countdown calculations. */
  dueDate: string | null;
  brief: string;
  toneOfVoice: string;
  targetKeywords: string[];
  wordCount: string;
  wordCountValue: number | null;
  payCents: number;
  payPerHourCents: number | null;
  priority: string;
  primaryCta: string;
  referenceLinks: string[];
  attachments: string[];
  styleGuide: WriterStyleGuide | null;
  started: boolean;
  canStart: boolean;
  latestSubmission: SubmissionVersion | null;
};

export type WriterNextAction = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  tone: "urgent" | "normal" | "idle";
};

export type WriterActivityItem = {
  id: string;
  kind: "claim" | "submission" | "feedback" | "revision" | "approval" | "earning" | "payout";
  text: string;
  at: string;
  href?: string;
};

export type WriterHomeSnapshot = {
  jobsDueThisWeek: number;
  monthEarningsCents: number;
  monthEarnings: string;
  currentRank: number | null;
  rankedWriters: number;
  unreadFeedback: number;
  nextAction: WriterNextAction;
  activityFeed: WriterActivityItem[];
};

export type RankingTab = "earners" | "quality" | "reliable" | "rising";
export type RankingPeriod = "weekly" | "monthly" | "all";

export type WriterRankingEntry = {
  rank: number;
  writerId: string;
  name: string;
  primary: string;
  secondary: string;
  isYou: boolean;
};

export type WriterRankingBoard = {
  tab: RankingTab;
  period: RankingPeriod;
  entries: WriterRankingEntry[];
  /** Set when the underlying data cannot honour the selected period. */
  periodNote: string | null;
};

export type WriterEarningsRow = {
  id: string;
  createdAt: string;
  type: string;
  description: string;
  jobTitle: string;
  client: string;
  amountCents: number;
  paymentStatus: string;
};

export type WriterEarnings = {
  summary: {
    lifetimeCents: number;
    monthCents: number;
    paidOutCents: number;
    availableCents: number;
    pendingCents: number;
  };
  rows: WriterEarningsRow[];
  payoutRequests: { id: string; requestedAt: string; amountCents: number; status: string }[];
};

export type WriterSettings = {
  fullName: string;
  email: string;
  bio: string;
  nicheTags: string[];
  available: boolean;
  paymentInfo: string;
  taxInfo: string;
  notificationPrefs: NotificationPrefs;
  /** False when supabase/writer-p0-upgrade.sql has not been applied yet. */
  schemaReady: boolean;
};

export type AdminQueueOrder = {
  id: string;
  title: string;
  owner: string;
  state: string;
  deadline: string;
};

export type AdminOrderDetail = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  brief: string;
  primaryCta: string;
  targetAudience: string;
  toneOfVoice: string;
  targetKeywords: string[];
  wordCount: string;
  priority: string;
  client: string;
  writer: string;
  contentType: string;
  latestSubmission: SubmissionVersion | null;
};

export type PayoutRequestItem = {
  id: string;
  writer: string;
  requestedAt: string;
  amount: string;
  status: string;
};

export type WalletSnapshot = {
  available: string;
  pending: string;
  activity: {
    id: string;
    label: string;
    date: string;
    amount: string;
  }[];
};

export type RankingEntry = {
  rank: string;
  name: string;
  note: string;
  score: string;
  rating: string;
};

export type InvoiceItem = {
  id: string;
  date: string;
  amount: string;
  status: string;
};

export type ContentTypeCatalogItem = {
  id: string;
  name: string;
  turnaround: string;
  price: string;
  status: string;
};

export type SeedWorkspaceDataResult = {
  ok: boolean;
  message: string;
};

export async function getContentTypeOptions({
  includeInactive = false,
}: {
  includeInactive?: boolean;
} = {}): Promise<ContentTypeOption[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const query = supabase
    .from("content_types")
    .select("id, name, description, turnaround_days, base_price_cents, active");

  if (!includeInactive) {
    query.eq("active", true);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return [];
  }

  return data
    .map((item) => {
      const service = getServiceByName(item.name);

      if (!service) {
        return {
          id: item.id,
          key: item.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          name: item.name,
          description: item.description ?? "Structured content service.",
          whatYouGet: item.description ?? "Structured content service.",
          perfectFor: "General publishing workflows.",
          priceLabel: item.base_price_cents >= 100 ? formatCurrency(item.base_price_cents) : `$${(item.base_price_cents / 100).toFixed(2)}/word`,
          turnaroundDays: item.turnaround_days,
          basePriceCents: item.base_price_cents,
          isOrderable: item.active,
          orderIndex: 999,
          fields: [],
        } satisfies ContentTypeOption;
      }

      return {
        id: item.id,
        key: service.key,
        name: service.name,
        description: service.description,
        whatYouGet: service.whatYouGet,
        perfectFor: service.perfectFor,
        priceLabel: service.priceLabel,
        turnaroundDays: item.turnaround_days,
        basePriceCents: item.base_price_cents,
        isOrderable: item.active && service.isOrderable,
        orderIndex: service.orderIndex,
        fields: service.fields,
      } satisfies ContentTypeOption;
    })
    .sort((left, right) => left.orderIndex - right.orderIndex || left.name.localeCompare(right.name));
}

export async function getClientFolders(clientProfileId: string): Promise<ClientFolder[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const [{ data: folders }, { data: orders }] = await Promise.all([
    supabase
      .from("client_folders")
      .select(
        "id, name, brief_template_url, brand_notes, tone_guide, preferred_content_types, default_word_count, target_audience, compliance_notes, delivery_preference, content_calendar_notes",
      )
      .eq("client_id", clientProfileId)
      .order("name", { ascending: true }),
    supabase
      .from("orders")
      .select("client_folder_id")
      .eq("client_id", clientProfileId),
  ]);

  const counts = new Map<string, number>();
  for (const order of orders ?? []) {
    if (!order.client_folder_id) continue;
    counts.set(order.client_folder_id, (counts.get(order.client_folder_id) ?? 0) + 1);
  }

  return (folders ?? []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    briefTemplateUrl: folder.brief_template_url ?? "",
    brandNotes: folder.brand_notes ?? "",
    toneGuide: folder.tone_guide ?? "",
    preferredContentTypes: folder.preferred_content_types ?? [],
    defaultWordCount: folder.default_word_count ? String(folder.default_word_count) : "",
    targetAudience: folder.target_audience ?? "",
    complianceNotes: folder.compliance_notes ?? "",
    deliveryPreference: folder.delivery_preference ?? "",
    contentCalendarNotes: folder.content_calendar_notes ?? "",
    orderCount: counts.get(folder.id) ?? 0,
  }));
}

export async function createClientFolder({
  name,
  briefTemplateUrl,
  brandNotes,
  toneGuide,
  preferredContentTypes,
  defaultWordCount,
  targetAudience,
  complianceNotes,
  deliveryPreference,
  contentCalendarNotes,
}: {
  name: string;
  briefTemplateUrl: string;
  brandNotes: string;
  toneGuide: string;
  preferredContentTypes: string[];
  defaultWordCount: string;
  targetAudience: string;
  complianceNotes: string;
  deliveryPreference: string;
  contentCalendarNotes: string;
}) {
  const user = await getCurrentAppUser();
  const supabase = createServerSupabaseClient();

  if (!user || user.role !== "client" || !supabase) {
    return { ok: false as const, message: "Sign in as a client before creating folders." };
  }

  const folderName = name.trim();
  if (folderName.length < 2) {
    return { ok: false as const, message: "Folder name must be at least 2 characters." };
  }

  const { error } = await supabase.from("client_folders").insert({
    client_id: user.profileId,
    name: folderName,
    brief_template_url: briefTemplateUrl.trim() || null,
    brand_notes: brandNotes.trim() || null,
    tone_guide: toneGuide.trim() || null,
    preferred_content_types: preferredContentTypes,
    default_word_count: defaultWordCount ? Number(defaultWordCount) : null,
    target_audience: targetAudience.trim() || null,
    compliance_notes: complianceNotes.trim() || null,
    delivery_preference: deliveryPreference.trim() || null,
    content_calendar_notes: contentCalendarNotes.trim() || null,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidateApp();
  return { ok: true as const, message: "Client folder created." };
}

export async function getClientOrders(clientProfileId: string): Promise<DashboardOrder[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        client_label,
        due_date,
        status,
        content_types(name),
        writer:profiles!orders_writer_id_fkey(full_name)
      `,
    )
    .eq("client_id", clientProfileId)
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return [];
  }

  return data.map((order) => ({
    id: order.id,
    name: order.title,
    clientLabel: order.client_label ?? "General client",
    contentType: readSingleRelation(order.content_types)?.name ?? "Unassigned type",
    writer: readSingleRelation(order.writer)?.full_name ?? "Unassigned",
    status: formatOrderStatus(order.status),
    deadline: formatDeadline(order.due_date),
  }));
}

export async function getClientReviewQueue(
  clientProfileId: string,
): Promise<ReviewQueueItem[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("submissions")
    .select(
      `
        id,
        submitted_at,
        status,
        order:orders!submissions_order_id_fkey(id, title, client_id, client_label),
        writer:profiles!submissions_writer_id_fkey(full_name)
      `,
    )
    .in("status", ["submitted", "resubmitted", "revision_requested"])
    .order("submitted_at", { ascending: false });

  const items = (data ?? []).filter(
    (item) => readSingleRelation(item.order)?.client_id === clientProfileId,
  );

  return items.map((item) => ({
    orderId: readSingleRelation(item.order)?.id ?? item.id,
    submissionId: item.id,
    title: readSingleRelation(item.order)?.title ?? "Submission",
    clientLabel: readSingleRelation(item.order)?.client_label ?? "General client",
    writer: readSingleRelation(item.writer)?.full_name ?? "Writer",
    due: formatRelativeDate(item.submitted_at),
    status: formatOrderStatus(item.status),
  }));
}

export async function getClientOrderDetail(
  orderId: string,
  clientProfileId: string,
): Promise<ClientOrderDetail | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        client_label,
        status,
        due_date,
        brief,
        primary_cta,
        target_audience,
        tone_of_voice,
        target_keywords,
        word_count,
        priority,
        reference_links,
        content_types(name),
        writer:profiles!orders_writer_id_fkey(full_name)
      `,
    )
    .eq("id", orderId)
    .eq("client_id", clientProfileId)
    .maybeSingle();

  if (!order) {
    return null;
  }

  const latestSubmission = await getLatestSubmission(orderId);

  return {
    id: order.id,
    title: order.title,
    clientLabel: order.client_label ?? "General client",
    status: formatOrderStatus(order.status),
    deadline: formatDeadline(order.due_date),
    contentType: readSingleRelation(order.content_types)?.name ?? "Unassigned type",
    writer: readSingleRelation(order.writer)?.full_name ?? "Unassigned",
    targetAudience: order.target_audience ?? "Not specified",
    toneOfVoice: order.tone_of_voice ?? "Not specified",
    targetKeywords: order.target_keywords ?? [],
    wordCount: order.word_count ? `${order.word_count} words` : "Not specified",
    priority: order.priority ? formatOrderStatus(order.priority) : "Standard",
    primaryCta: order.primary_cta ?? "Not specified",
    referenceLinks: order.reference_links ?? [],
    brief: order.brief,
    latestSubmission,
  };
}

const ACTIVE_DB_STATUSES = ["claimed", "revision_requested"];

export async function getWriterMarketplace(
  writerProfileId: string,
  filters: MarketplaceFilters = {},
): Promise<MarketplaceResult> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { jobs: [], categories: [], totalOpen: 0 };
  }

  const { data } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        due_date,
        budget_cents,
        word_count,
        status,
        target_audience,
        created_at,
        reserved_by,
        reserved_until,
        client:profiles!orders_client_id_fkey(company_name, full_name),
        content_types(name)
      `,
    )
    .eq("status", "open")
    .is("writer_id", null)
    .order("created_at", { ascending: false });

  const now = Date.now();
  // Marketplace shows open jobs plus jobs whose reservation expired (or that the viewer reserved).
  const visible = (data ?? []).filter((order) => {
    if (!order.reserved_by || !order.reserved_until) return true;
    if (order.reserved_by === writerProfileId) return true;
    return new Date(order.reserved_until).getTime() <= now;
  });

  const all: MarketplaceOrder[] = visible.map((order) => {
    const client = readSingleRelation(order.client);
    const reservedByMe = order.reserved_by === writerProfileId && new Date(order.reserved_until ?? 0).getTime() > now;
    const payCents = order.budget_cents ?? 0;

    return {
      id: order.id,
      title: order.title,
      client: client?.company_name ?? client?.full_name ?? "Penned client",
      industry: order.target_audience ?? "General business",
      category: readSingleRelation(order.content_types)?.name ?? "Uncategorized",
      wordCount: order.word_count ?? null,
      payCents,
      pay: payCents ? formatUsd(payCents) : "TBD",
      dueDate: order.due_date ?? null,
      turnaround: formatDeadline(order.due_date),
      status: mapWriterStatus(order.status).label,
      createdAt: order.created_at,
      reservedByMe,
      reservedUntil: reservedByMe ? order.reserved_until : null,
      reservedMinutesLeft: reservedByMe
        ? Math.max(1, Math.ceil((new Date(order.reserved_until).getTime() - now) / 60_000))
        : null,
      payPerHourCents: estimatePayPerHour(payCents, order.word_count),
    };
  });

  const categories = [...new Set(all.map((job) => job.category))].sort((a, b) => a.localeCompare(b));
  const query = filters.q?.trim().toLowerCase() ?? "";
  const minPayCents = filters.minPayDollars && filters.minPayDollars > 0 ? filters.minPayDollars * 100 : 0;

  const filtered = all.filter((job) => {
    if (query && !`${job.title} ${job.client} ${job.industry} ${job.category}`.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.category && job.category !== filters.category) return false;
    if (minPayCents && job.payCents < minPayCents) return false;
    if (filters.length) {
      const words = job.wordCount ?? 0;
      if (filters.length === "short" && words >= 800) return false;
      if (filters.length === "medium" && (words < 800 || words > 1500)) return false;
      if (filters.length === "long" && words <= 1500) return false;
    }
    return true;
  });

  const dueValue = (job: MarketplaceOrder) => hoursUntil(job.dueDate) ?? Number.POSITIVE_INFINITY;

  switch (filters.sort) {
    case "pay_desc":
      filtered.sort((a, b) => b.payCents - a.payCents);
      break;
    case "pay_hour_desc":
      filtered.sort((a, b) => (b.payPerHourCents ?? -1) - (a.payPerHourCents ?? -1));
      break;
    case "due_soon":
      filtered.sort((a, b) => dueValue(a) - dueValue(b));
      break;
    case "words_asc":
      filtered.sort((a, b) => (a.wordCount ?? 0) - (b.wordCount ?? 0));
      break;
    case "words_desc":
      filtered.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0));
      break;
    default:
      filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return { jobs: filtered, categories, totalOpen: all.length };
}

/** Every job the writer has claimed, with P0 status mapping (paid derived from settled payouts). */
export async function getWriterJobs(writerProfileId: string): Promise<WriterJob[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const [{ data }, ledger] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
          id,
          title,
          status,
          due_date,
          word_count,
          budget_cents,
          updated_at,
          intake_details,
          client:profiles!orders_client_id_fkey(company_name, full_name),
          content_types(name)
        `,
      )
      .eq("writer_id", writerProfileId)
      .order("updated_at", { ascending: false }),
    readWriterLedger(writerProfileId),
  ]);

  return (data ?? []).map((order) => {
    const client = readSingleRelation(order.client);
    const payCents = order.budget_cents ?? 0;

    return {
      id: order.id,
      title: order.title,
      client: client?.company_name ?? client?.full_name ?? "Client",
      category: readSingleRelation(order.content_types)?.name ?? "Content order",
      wordCount: order.word_count ?? null,
      payCents,
      pay: payCents ? formatUsd(payCents) : "TBD",
      dueDate: order.due_date ?? null,
      deadline: formatDeadline(order.due_date),
      status: mapWriterStatus(order.status, {
        started: isJobStarted(order.intake_details),
        paid: ledger.paidOrderIds.has(order.id),
      }),
      dbStatus: order.status,
      updatedAt: order.updated_at,
    } satisfies WriterJob;
  });
}

/** Jobs that still need work from the writer (not started, in progress, revisions). */
export async function getWriterAssignments(writerProfileId: string): Promise<WriterJob[]> {
  const jobs = await getWriterJobs(writerProfileId);
  return jobs
    .filter((job) => ACTIVE_DB_STATUSES.includes(job.dbStatus))
    .sort(
      (a, b) =>
        (hoursUntil(a.dueDate) ?? Number.POSITIVE_INFINITY) - (hoursUntil(b.dueDate) ?? Number.POSITIVE_INFINITY),
    );
}

export async function getWriterOrderDetail(
  orderId: string,
  writerProfileId: string,
): Promise<WriterOrderDetail | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        client_label,
        status,
        due_date,
        brief,
        primary_cta,
        tone_of_voice,
        target_keywords,
        word_count,
        budget_cents,
        priority,
        reference_links,
        attachments,
        intake_details,
        client:profiles!orders_client_id_fkey(company_name, full_name),
        content_types(name),
        folder:client_folders(name, brief_template_url, brand_notes, tone_guide, target_audience, compliance_notes, delivery_preference)
      `,
    )
    .eq("id", orderId)
    .eq("writer_id", writerProfileId)
    .maybeSingle();

  if (!order) {
    return null;
  }

  const [latestSubmission, ledger] = await Promise.all([
    getLatestSubmission(orderId),
    readWriterLedger(writerProfileId),
  ]);
  const client = readSingleRelation(order.client);
  const folder = readSingleRelation(order.folder);
  const started = isJobStarted(order.intake_details);
  const writerStatus = mapWriterStatus(order.status, {
    started,
    paid: ledger.paidOrderIds.has(order.id),
  });
  const payCents = order.budget_cents ?? 0;

  return {
    id: order.id,
    title: order.title,
    client: client?.company_name ?? client?.full_name ?? "Client",
    contentType: readSingleRelation(order.content_types)?.name ?? "Content order",
    status: writerStatus.label,
    writerStatus,
    dbStatus: order.status,
    deadline: formatDeadline(order.due_date),
    dueDate: order.due_date ?? null,
    brief: order.brief,
    toneOfVoice: order.tone_of_voice ?? "Not specified",
    targetKeywords: order.target_keywords ?? [],
    wordCount: order.word_count ? `${order.word_count} words` : "Not specified",
    wordCountValue: order.word_count ?? null,
    payCents,
    payPerHourCents: estimatePayPerHour(payCents, order.word_count),
    priority: order.priority ? formatOrderStatus(order.priority) : "Standard",
    primaryCta: order.primary_cta ?? "Not specified",
    referenceLinks: order.reference_links ?? [],
    attachments: order.attachments ?? [],
    styleGuide: folder
      ? {
          folderName: folder.name ?? "",
          briefTemplateUrl: folder.brief_template_url ?? "",
          brandNotes: folder.brand_notes ?? "",
          toneGuide: folder.tone_guide ?? "",
          targetAudience: folder.target_audience ?? "",
          complianceNotes: folder.compliance_notes ?? "",
          deliveryPreference: folder.delivery_preference ?? "",
        }
      : null,
    started,
    canStart: order.status === "claimed" && !started,
    latestSubmission,
  };
}

export async function getWriterHomeSnapshot(writerId: string): Promise<WriterHomeSnapshot> {
  const empty: WriterHomeSnapshot = {
    jobsDueThisWeek: 0,
    monthEarningsCents: 0,
    monthEarnings: formatUsd(0),
    currentRank: null,
    rankedWriters: 0,
    unreadFeedback: 0,
    nextAction: browseMarketplaceAction(),
    activityFeed: [],
  };
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return empty;
  }

  const [jobs, ledger, rankingRows, submissionsResult] = await Promise.all([
    getWriterJobs(writerId),
    readWriterLedger(writerId),
    supabase.from("rankings").select("writer_id, score").order("score", { ascending: false }),
    supabase
      .from("submissions")
      .select("id, order_id, version, submitted_at")
      .eq("writer_id", writerId)
      .order("submitted_at", { ascending: false })
      .limit(20),
  ]);

  const active = jobs.filter((job) => ACTIVE_DB_STATUSES.includes(job.dbStatus));
  const jobsDueThisWeek = active.filter((job) => {
    const hours = hoursUntil(job.dueDate);
    return hours !== null && hours <= 7 * 24;
  }).length;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthEarningsCents = ledger.transactions
    .filter((item) => item.type === "earning" && new Date(item.created_at) >= monthStart)
    .reduce((sum, item) => sum + item.amount_cents, 0);

  const ranked = rankingRows.data ?? [];
  const myRanking = ranked.find((item) => item.writer_id === writerId);
  const currentRank = myRanking
    ? ranked.findIndex((item) => item.score === myRanking.score) + 1
    : null;

  const revisionJobs = active.filter((job) => job.dbStatus === "revision_requested");

  // Activity feed ---------------------------------------------------------
  const jobTitles = new Map(jobs.map((job) => [job.id, job.title]));
  const feed: WriterActivityItem[] = [];
  const mySubmissions = submissionsResult.data ?? [];

  for (const job of jobs) {
    const href = `/writer/orders/${job.id}`;
    if (job.dbStatus === "claimed") {
      feed.push({ id: `claim-${job.id}`, kind: "claim", text: `Claimed "${job.title}"`, at: job.updatedAt, href });
    } else if (job.dbStatus === "revision_requested") {
      feed.push({ id: `rev-${job.id}`, kind: "revision", text: `Revisions requested on "${job.title}"`, at: job.updatedAt, href });
    } else if (job.dbStatus === "accepted") {
      feed.push({ id: `ok-${job.id}`, kind: "approval", text: `"${job.title}" was approved`, at: job.updatedAt, href });
    }
  }

  for (const submission of mySubmissions) {
    feed.push({
      id: `sub-${submission.id}`,
      kind: "submission",
      text: `Submitted version ${submission.version} of "${jobTitles.get(submission.order_id) ?? "a job"}"`,
      at: submission.submitted_at,
      href: `/writer/orders/${submission.order_id}`,
    });
  }

  if (mySubmissions.length) {
    const submissionOrder = new Map(mySubmissions.map((item) => [item.id, item.order_id]));
    const { data: comments } = await supabase
      .from("submission_comments")
      .select(
        `
          id,
          submission_id,
          created_at,
          author:profiles!submission_comments_author_id_fkey(full_name)
        `,
      )
      .in("submission_id", [...submissionOrder.keys()])
      .neq("author_id", writerId)
      .order("created_at", { ascending: false })
      .limit(10);

    for (const comment of comments ?? []) {
      const orderId = submissionOrder.get(comment.submission_id);
      feed.push({
        id: `fb-${comment.id}`,
        kind: "feedback",
        text: `${readSingleRelation(comment.author)?.full_name ?? "A client"} left feedback on "${jobTitles.get(orderId ?? "") ?? "your submission"}"`,
        at: comment.created_at,
        href: orderId ? `/writer/orders/${orderId}` : undefined,
      });
    }
  }

  for (const item of ledger.transactions.slice(-10)) {
    if (item.type === "earning") {
      feed.push({
        id: `tx-${item.id}`,
        kind: "earning",
        text: `Earned ${formatUsd(item.amount_cents)}${item.order_id && jobTitles.get(item.order_id) ? ` from "${jobTitles.get(item.order_id)}"` : ""}`,
        at: item.created_at,
        href: "/writer/earnings",
      });
    } else if (item.type === "payout") {
      feed.push({
        id: `tx-${item.id}`,
        kind: "payout",
        text: `Payout of ${formatUsd(Math.abs(item.amount_cents))} approved`,
        at: item.created_at,
        href: "/writer/earnings",
      });
    }
  }

  feed.sort((a, b) => b.at.localeCompare(a.at));

  return {
    jobsDueThisWeek,
    monthEarningsCents,
    monthEarnings: formatUsd(monthEarningsCents),
    currentRank,
    rankedWriters: ranked.length,
    // No read-tracking exists yet: feedback awaiting action = jobs sitting in "revisions requested".
    unreadFeedback: revisionJobs.length,
    nextAction: buildNextAction(active),
    activityFeed: feed.slice(0, 10),
  };
}

function browseMarketplaceAction(): WriterNextAction {
  return {
    title: "Pick up your next job",
    description: "Nothing is waiting on you. Browse open jobs and claim one that fits your niche.",
    href: "/writer/marketplace",
    ctaLabel: "Browse marketplace",
    tone: "idle",
  };
}

function buildNextAction(active: WriterJob[]): WriterNextAction {
  const byDue = (a: WriterJob, b: WriterJob) =>
    (hoursUntil(a.dueDate) ?? Number.POSITIVE_INFINITY) - (hoursUntil(b.dueDate) ?? Number.POSITIVE_INFINITY);
  const revision = active.filter((job) => job.dbStatus === "revision_requested").sort(byDue)[0];

  if (revision) {
    return {
      title: `Address revisions on "${revision.title}"`,
      description: `${revision.client} asked for changes. ${revision.deadline}.`,
      href: `/writer/orders/${revision.id}`,
      ctaLabel: "Open revisions",
      tone: "urgent",
    };
  }

  const next = [...active].sort(byDue)[0];

  if (next) {
    const started = next.status.key === "in_progress";
    return {
      title: `${started ? "Continue" : "Start"} "${next.title}"`,
      description: `${next.client} · ${next.pay}. ${next.deadline}.`,
      href: `/writer/orders/${next.id}`,
      ctaLabel: started ? "Continue job" : "Start job",
      tone: "normal",
    };
  }

  return browseMarketplaceAction();
}

type LedgerTransaction = {
  id: string;
  order_id: string | null;
  type: string;
  amount_cents: number;
  created_at: string;
};

/**
 * Reads the writer's transactions (oldest first) and derives which accepted orders are
 * "Paid": earnings are settled first-in-first-out against the total of settled payouts.
 */
async function readWriterLedger(writerProfileId: string): Promise<{
  walletId: string | null;
  transactions: LedgerTransaction[];
  paidOrderIds: Set<string>;
  paidOutCents: number;
}> {
  const supabase = createServerSupabaseClient();
  const empty = { walletId: null, transactions: [], paidOrderIds: new Set<string>(), paidOutCents: 0 };

  if (!supabase) {
    return empty;
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("writer_id", writerProfileId)
    .maybeSingle();

  if (!wallet) {
    return empty;
  }

  const { data } = await supabase
    .from("transactions")
    .select("id, order_id, type, amount_cents, created_at")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: true });

  const transactions = (data ?? []) as LedgerTransaction[];
  const paidOutCents = transactions
    .filter((item) => item.type === "payout")
    .reduce((sum, item) => sum + Math.abs(item.amount_cents), 0);
  const paidOrderIds = new Set<string>();
  let running = 0;

  for (const item of transactions) {
    if (item.type !== "earning") continue;
    running += item.amount_cents;
    if (item.order_id && running <= paidOutCents) {
      paidOrderIds.add(item.order_id);
    }
  }

  return { walletId: wallet.id, transactions, paidOrderIds, paidOutCents };
}

export async function getWriterEarnings(writerProfileId: string): Promise<WriterEarnings> {
  const supabase = createServerSupabaseClient();
  const empty: WriterEarnings = {
    summary: { lifetimeCents: 0, monthCents: 0, paidOutCents: 0, availableCents: 0, pendingCents: 0 },
    rows: [],
    payoutRequests: [],
  };

  if (!supabase) {
    return empty;
  }

  await ensureWallet(writerProfileId);

  const [ledger, walletResult, payoutResult] = await Promise.all([
    readWriterLedger(writerProfileId),
    supabase
      .from("wallets")
      .select("available_cents, pending_cents")
      .eq("writer_id", writerProfileId)
      .maybeSingle(),
    supabase
      .from("payout_requests")
      .select("id, amount_cents, status, requested_at")
      .eq("writer_id", writerProfileId)
      .order("requested_at", { ascending: false })
      .limit(10),
  ]);

  const orderIds = [...new Set(ledger.transactions.map((item) => item.order_id).filter(Boolean))] as string[];
  const orderLookup = new Map<string, { title: string; client: string }>();

  if (orderIds.length) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, title, client:profiles!orders_client_id_fkey(company_name, full_name)")
      .in("id", orderIds);

    for (const order of orders ?? []) {
      const client = readSingleRelation(order.client);
      orderLookup.set(order.id, {
        title: order.title,
        client: client?.company_name ?? client?.full_name ?? "Client",
      });
    }
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const earnings = ledger.transactions.filter((item) => item.type === "earning");
  const payoutRequests = (payoutResult.data ?? []).map((item) => ({
    id: item.id,
    requestedAt: item.requested_at,
    amountCents: item.amount_cents,
    status: formatOrderStatus(item.status),
  }));
  const pendingRequestCents = payoutRequests
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amountCents, 0);

  return {
    summary: {
      lifetimeCents: earnings.reduce((sum, item) => sum + item.amount_cents, 0),
      monthCents: earnings
        .filter((item) => new Date(item.created_at) >= monthStart)
        .reduce((sum, item) => sum + item.amount_cents, 0),
      paidOutCents: ledger.paidOutCents,
      availableCents: walletResult.data?.available_cents ?? 0,
      pendingCents: (walletResult.data?.pending_cents ?? 0) + pendingRequestCents,
    },
    rows: [...ledger.transactions].reverse().map((item) => {
      const order = item.order_id ? orderLookup.get(item.order_id) : undefined;

      return {
        id: item.id,
        createdAt: item.created_at,
        type: item.type,
        description: humanizeTransactionType(item.type),
        jobTitle: order?.title ?? "—",
        client: order?.client ?? "—",
        amountCents: item.amount_cents,
        paymentStatus:
          item.type === "earning"
            ? item.order_id && ledger.paidOrderIds.has(item.order_id)
              ? "Paid"
              : "Awaiting payout"
            : item.type === "payout"
              ? "Settled"
              : "Adjustment",
      };
    }),
    payoutRequests,
  };
}

const EMPTY_SETTINGS = (fullName: string, email: string): WriterSettings => ({
  fullName,
  email,
  bio: "",
  nicheTags: [],
  available: true,
  paymentInfo: "",
  taxInfo: "",
  notificationPrefs: normalizeNotificationPrefs({}),
  schemaReady: false,
});

export async function getWriterSettings(
  writerProfileId: string,
  fallback: { fullName: string; email: string },
): Promise<WriterSettings> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return EMPTY_SETTINGS(fallback.fullName, fallback.email);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, bio, niche_tags, available, payment_info, tax_info, notification_prefs")
    .eq("id", writerProfileId)
    .maybeSingle();

  if (error || !data) {
    return EMPTY_SETTINGS(fallback.fullName, fallback.email);
  }

  return {
    fullName: data.full_name ?? fallback.fullName,
    email: data.email ?? fallback.email,
    bio: data.bio ?? "",
    nicheTags: data.niche_tags ?? [],
    available: data.available ?? true,
    paymentInfo: data.payment_info ?? "",
    taxInfo: data.tax_info ?? "",
    notificationPrefs: normalizeNotificationPrefs(data.notification_prefs),
    schemaReady: true,
  };
}

export async function saveWriterSettings(values: {
  fullName: string;
  bio: string;
  nicheTags: string;
  available: boolean;
  paymentInfo: string;
  taxInfo: string;
  notificationPrefs: NotificationPrefs;
}) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const fullName = values.fullName.trim();
  if (fullName.length < 2) {
    return { ok: false as const, message: "Name must be at least 2 characters." };
  }

  const bio = values.bio.trim();
  if (bio.length > 1000) {
    return { ok: false as const, message: "Bio must be 1,000 characters or fewer." };
  }

  const nicheTags = [
    ...new Set(
      values.nicheTags
        .split(/[\n,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
  if (nicheTags.length > 12 || nicheTags.some((tag) => tag.length > 40)) {
    return { ok: false as const, message: "Use at most 12 niche tags of 40 characters or fewer." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      bio: bio || null,
      niche_tags: nicheTags,
      available: values.available,
      payment_info: values.paymentInfo.trim() || null,
      tax_info: values.taxInfo.trim() || null,
      notification_prefs: values.notificationPrefs,
    })
    .eq("id", user.profileId);

  if (error) {
    return {
      ok: false as const,
      message: error.message.includes("column")
        ? "Settings columns are missing. Run supabase/writer-p0-upgrade.sql first."
        : error.message,
    };
  }

  revalidateApp();
  return { ok: true as const, message: "Settings saved." };
}

export async function getWriterWallet(writerProfileId: string): Promise<WalletSnapshot> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      available: formatCurrency(0),
      pending: formatCurrency(0),
      activity: [],
    };
  }

  await ensureWallet(writerProfileId);

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, available_cents, pending_cents")
    .eq("writer_id", writerProfileId)
    .single();

  const { data: activity } = await supabase
    .from("transactions")
    .select("id, type, amount_cents, created_at")
    .eq("wallet_id", wallet?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!wallet) {
    return {
      available: formatCurrency(0),
      pending: formatCurrency(0),
      activity: [],
    };
  }

  return {
    available: formatCurrency(wallet.available_cents),
    pending: formatCurrency(wallet.pending_cents),
    activity: (activity ?? []).map((item) => ({
      id: item.id,
      label: humanizeTransactionType(item.type),
      date: formatRelativeDate(item.created_at),
      amount: `${item.amount_cents < 0 ? "-" : "+"}${formatCurrency(Math.abs(item.amount_cents))}`,
    })),
  };
}

export async function getRankingBoard(): Promise<RankingEntry[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("rankings")
    .select("score, rating, quality_deductions, profiles!rankings_writer_id_fkey(full_name)")
    .order("score", { ascending: false })
    .limit(8);

  if (!data?.length) {
    return [];
  }

  return data.map((item, index) => ({
    rank: String(index + 1),
    name: readSingleRelation(item.profiles)?.full_name ?? `Writer ${index + 1}`,
    note: `${item.quality_deductions} quality deductions recorded`,
    score: `${item.score} pts`,
    rating: `${item.rating} rating`,
  }));
}

export async function getWriterRankingBoard(
  tab: RankingTab,
  period: RankingPeriod,
  viewerProfileId: string,
): Promise<WriterRankingBoard> {
  const supabase = createServerSupabaseClient();
  const board = (entries: WriterRankingEntry[], periodNote: string | null = null): WriterRankingBoard => ({
    tab,
    period,
    entries,
    periodNote,
  });

  if (!supabase) {
    return board([]);
  }

  const since = periodStart(period);
  const [{ data: writers }, { data: rankings }, { data: wallets }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "writer"),
    supabase.from("rankings").select("writer_id, score, rating, quality_deductions, completed_jobs"),
    supabase.from("wallets").select("id, writer_id"),
  ]);

  const names = new Map((writers ?? []).map((item) => [item.id, item.full_name as string]));
  const rankingByWriter = new Map((rankings ?? []).map((item) => [item.writer_id, item]));
  const walletOwner = new Map((wallets ?? []).map((item) => [item.id, item.writer_id as string]));

  const rank = (
    rows: { writerId: string; sortValue: number; primary: string; secondary: string }[],
    keep: (row: { writerId: string; sortValue: number }) => boolean,
  ) => {
    const sorted = rows
      .filter((row) => names.has(row.writerId))
      .sort((a, b) => b.sortValue - a.sortValue || (names.get(a.writerId) ?? "").localeCompare(names.get(b.writerId) ?? ""));
    const entries: WriterRankingEntry[] = [];
    sorted.forEach((row, index) => {
      const isYou = row.writerId === viewerProfileId;
      if (!keep(row) && !isYou) return;
      if (entries.length >= 20 && !isYou) return;
      entries.push({
        rank: index + 1,
        writerId: row.writerId,
        name: names.get(row.writerId) ?? "Writer",
        primary: row.primary,
        secondary: row.secondary,
        isYou,
      });
    });
    return entries;
  };

  if (tab === "quality") {
    const rows = [...names.keys()].map((writerId) => {
      const item = rankingByWriter.get(writerId);
      const rating = Number(item?.rating ?? 0);
      return {
        writerId,
        sortValue: rating * 1000 + (item?.score ?? 0),
        primary: rating ? `${rating.toFixed(1)} / 5 rating` : "No rating yet",
        secondary: `${item?.completed_jobs ?? 0} jobs · ${item?.quality_deductions ?? 0} quality deductions`,
      };
    });
    return board(
      rank(rows, (row) => row.sortValue > 0),
      period === "all" ? null : "Quality ratings are not tracked per period yet, so this board shows all-time data.",
    );
  }

  if (tab === "reliable") {
    const { data: submissions } = await supabase
      .from("submissions")
      .select("order_id, writer_id, submitted_at, order:orders!submissions_order_id_fkey(due_date)")
      .order("submitted_at", { ascending: true });

    // Only the first submission per order counts toward on-time delivery.
    const firstByOrder = new Map<string, { writerId: string; submittedAt: string; dueDate: string | null }>();
    for (const item of submissions ?? []) {
      if (firstByOrder.has(item.order_id)) continue;
      firstByOrder.set(item.order_id, {
        writerId: item.writer_id,
        submittedAt: item.submitted_at,
        dueDate: readSingleRelation(item.order)?.due_date ?? null,
      });
    }

    const stats = new Map<string, { total: number; onTime: number }>();
    for (const item of firstByOrder.values()) {
      if (since && new Date(item.submittedAt) < since) continue;
      const deadline = dueDateToDeadline(item.dueDate);
      const entry = stats.get(item.writerId) ?? { total: 0, onTime: 0 };
      entry.total += 1;
      if (!deadline || new Date(item.submittedAt) <= deadline) entry.onTime += 1;
      stats.set(item.writerId, entry);
    }

    const rows = [...names.keys()].map((writerId) => {
      const entry = stats.get(writerId);
      const percent = entry ? Math.round((entry.onTime / entry.total) * 100) : 0;
      return {
        writerId,
        sortValue: entry ? percent * 1000 + entry.total : -1,
        primary: entry ? `${percent}% on time` : "No deliveries yet",
        secondary: entry ? `${entry.onTime} of ${entry.total} first drafts delivered by the due date` : "—",
      };
    });
    return board(
      rank(rows, (row) => row.sortValue >= 0),
      "On-time rate is estimated from first submission time vs. due date.",
    );
  }

  // earners + rising both read earning transactions for the period.
  let query = supabase
    .from("transactions")
    .select("wallet_id, amount_cents, created_at")
    .eq("type", "earning");
  if (since) {
    query = query.gte("created_at", since.toISOString());
  }
  const { data: earningRows } = await query;
  const earned = new Map<string, { cents: number; jobs: number }>();
  for (const item of earningRows ?? []) {
    const writerId = walletOwner.get(item.wallet_id);
    if (!writerId) continue;
    const entry = earned.get(writerId) ?? { cents: 0, jobs: 0 };
    entry.cents += item.amount_cents;
    entry.jobs += 1;
    earned.set(writerId, entry);
  }

  if (tab === "earners") {
    const rows = [...names.keys()].map((writerId) => {
      const entry = earned.get(writerId);
      return {
        writerId,
        sortValue: entry?.cents ?? 0,
        primary: formatUsd(entry?.cents ?? 0),
        secondary: `${entry?.jobs ?? 0} paid ${entry?.jobs === 1 ? "job" : "jobs"}`,
      };
    });
    return board(rank(rows, (row) => row.sortValue > 0));
  }

  // rising: all-time uses the ranking score; periods count +10 pts per approved job in that window.
  const rows = [...names.keys()].map((writerId) => {
    const points = period === "all" ? (rankingByWriter.get(writerId)?.score ?? 0) : (earned.get(writerId)?.jobs ?? 0) * 10;
    return {
      writerId,
      sortValue: points,
      primary: period === "all" ? `${points} pts` : `+${points} pts`,
      secondary: period === "all" ? "Total ranking score" : "Score gained in this period",
    };
  });
  return board(rank(rows, (row) => row.sortValue > 0));
}

function periodStart(period: RankingPeriod): Date | null {
  if (period === "all") return null;
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  if (period === "weekly") {
    date.setUTCDate(date.getUTCDate() - 7);
  } else {
    date.setUTCDate(date.getUTCDate() - 30);
  }
  return date;
}

export async function getAdminOrderQueue(): Promise<AdminQueueOrder[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        client_label,
        status,
        due_date,
        client:profiles!orders_client_id_fkey(company_name, full_name)
      `,
    )
    .order("updated_at", { ascending: false });

  return (data ?? []).map((order) => {
    const client = readSingleRelation(order.client);

    return {
      id: order.id,
      title: order.title,
      owner: client?.company_name ?? client?.full_name ?? "Client account",
      state: formatOrderStatus(order.status),
      deadline: formatDeadline(order.due_date),
    };
  });
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
        id,
        title,
        client_label,
        status,
        due_date,
        brief,
        primary_cta,
        target_audience,
        tone_of_voice,
        target_keywords,
        word_count,
        priority,
        client:profiles!orders_client_id_fkey(full_name, company_name),
        writer:profiles!orders_writer_id_fkey(full_name),
        content_types(name)
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    title: order.title,
    status: formatOrderStatus(order.status),
    deadline: formatDeadline(order.due_date),
    brief: order.brief,
    primaryCta: order.primary_cta ?? "Not specified",
    targetAudience: order.target_audience ?? "Not specified",
    toneOfVoice: order.tone_of_voice ?? "Not specified",
    targetKeywords: order.target_keywords ?? [],
    wordCount: order.word_count ? `${order.word_count} words` : "Not specified",
    priority: order.priority ? formatOrderStatus(order.priority) : "Standard",
    client: readSingleRelation(order.client)?.company_name ??
      readSingleRelation(order.client)?.full_name ??
      "Client",
    writer: readSingleRelation(order.writer)?.full_name ?? "Unassigned",
    contentType: readSingleRelation(order.content_types)?.name ?? "Content order",
    latestSubmission: await getLatestSubmission(order.id),
  };
}

export async function getContentTypeCatalog(): Promise<ContentTypeCatalogItem[]> {
  const options = await getContentTypeOptions({ includeInactive: true });

  return options.map((item) => ({
    id: item.id,
    name: item.name,
    turnaround: `${item.turnaroundDays} business days`,
    price: item.priceLabel,
    status: item.isOrderable ? "Active" : "Coming soon",
  }));
}

export async function getPayoutRequests(): Promise<PayoutRequestItem[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("payout_requests")
    .select(
      `
        id,
        amount_cents,
        status,
        requested_at,
        writer:profiles!payout_requests_writer_id_fkey(full_name)
      `,
    )
    .order("requested_at", { ascending: false });

  return (data ?? []).map((item) => ({
    id: item.id,
    writer: readSingleRelation(item.writer)?.full_name ?? "Writer",
    requestedAt: formatRelativeDate(item.requested_at),
    amount: formatCurrency(item.amount_cents),
    status: formatOrderStatus(item.status),
  }));
}

export async function getInvoices(clientProfileId: string): Promise<InvoiceItem[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("id, plan_name, status, created_at")
    .eq("client_id", clientProfileId)
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return [];
  }

  return data.map((item) => ({
    id: item.id.slice(0, 8).toUpperCase(),
    date: formatDate(item.created_at),
    amount: item.plan_name,
    status: item.status,
  }));
}

export async function createOrder(values: OrderFormValues) {
  const parsed = orderSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    return {
      ok: false as const,
      message: firstError ?? "Fix the highlighted fields and submit again.",
      errors: {
        clientLabel: fieldErrors.clientLabel?.[0],
        clientFolderId: fieldErrors.clientFolderId?.[0],
        title: fieldErrors.title?.[0],
        contentTypeId: fieldErrors.contentTypeId?.[0],
        serviceTier: fieldErrors.serviceTier?.[0],
        language: fieldErrors.language?.[0],
        targetAudience: fieldErrors.targetAudience?.[0],
        toneOfVoice: fieldErrors.toneOfVoice?.[0],
        targetKeywords: fieldErrors.targetKeywords?.[0],
        dueDate: fieldErrors.dueDate?.[0],
        wordCount: fieldErrors.wordCount?.[0],
        priority: fieldErrors.priority?.[0],
        primaryCta: fieldErrors.primaryCta?.[0],
        referenceLinks: fieldErrors.referenceLinks?.[0],
        brief: fieldErrors.brief?.[0],
      },
    };
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      ok: false as const,
      message: "Supabase is not configured yet.",
      errors: {},
    };
  }

  const user = await getCurrentAppUser();

  if (!user) {
    return {
      ok: false as const,
      message: "Select a client role before creating an order.",
      errors: {},
    };
  }

  const payload = parsed.data;
  const { data: contentType } = await supabase
    .from("content_types")
    .select("id, name, base_price_cents, active")
    .eq("id", payload.contentTypeId)
    .maybeSingle();

  const service = getServiceByName(contentType?.name);

  if (!contentType || !service || !contentType.active || !service.isOrderable) {
    return {
      ok: false as const,
      message: "That content type is not available for ordering yet.",
      errors: {
        contentTypeId: "Choose an active content type.",
      },
    };
  }

  const serviceFieldErrors = validateServiceFields(service, payload.serviceFields);
  if (serviceFieldErrors.length) {
    return {
      ok: false as const,
      message: serviceFieldErrors[0],
      errors: {},
    };
  }

  const wordCount = payload.wordCount;
  const baseRate = contentType.base_price_cents;
  const tierMarkup = payload.serviceTier === "rank" ? 10 : 0;
  const rushMarkup = payload.priority === "rush" ? 2 : 0;
  const budgetCents = wordCount * (baseRate + tierMarkup + rushMarkup);
  const folderName = payload.clientFolderId
    ? (await getClientFolders(user.profileId)).find((folder) => folder.id === payload.clientFolderId)?.name
    : "";
  const clientLabel = payload.clientLabel.trim() || folderName || "Unnamed client";

  const { error } = await supabase.from("orders").insert({
    client_id: user.profileId,
    client_label: clientLabel,
    client_folder_id: payload.clientFolderId || null,
    content_type_id: payload.contentTypeId,
    title: payload.title,
    brief: payload.brief,
    primary_cta: payload.primaryCta,
    reference_links: splitLinesAndCommas(payload.referenceLinks),
    target_audience: payload.targetAudience,
    tone_of_voice: payload.toneOfVoice,
    target_keywords: splitLinesAndCommas(payload.targetKeywords),
    word_count: payload.wordCount,
    priority: payload.priority,
    due_date: payload.dueDate || null,
    budget_cents: budgetCents,
    language: payload.language,
    service_tier: payload.serviceTier,
    intake_details: payload.serviceFields,
    status: "open",
  });

  if (error) {
    return {
      ok: false as const,
      message: error.message,
      errors: {},
    };
  }

  revalidateApp();

  return {
    ok: true as const,
    message: "Order created and added to the writer marketplace.",
    errors: {},
  };
}

const CLIENT_SAMPLE_TITLES = [
  "Review Sample — Operations case study",
  "Review Sample — Workflow blog draft",
] as const;

const WRITER_SAMPLE_TITLES = [
  "Review Sample — Accepted feature article",
  "Review Sample — Claimed landing page refresh",
  "Review Sample — Open newsletter brief",
] as const;

export async function seedWorkspaceReviewData(): Promise<SeedWorkspaceDataResult> {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user) {
    return { ok: false, message: "Sign in before loading review data." };
  }

  if (user.role === "client") {
    return seedClientReviewData(user.profileId);
  }

  if (user.role === "writer") {
    return seedWriterReviewData(user.profileId);
  }

  return {
    ok: false,
    message: "Use a client or writer account to generate review data for that workspace.",
  };
}

async function seedClientReviewData(clientProfileId: string): Promise<SeedWorkspaceDataResult> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const existing = await supabase
    .from("orders")
    .select("id")
    .eq("client_id", clientProfileId)
    .in("title", [...CLIENT_SAMPLE_TITLES]);

  if ((existing.data ?? []).length >= CLIENT_SAMPLE_TITLES.length) {
    return { ok: true, message: "Sample client orders are already loaded." };
  }

  const writer = await ensureSupportProfile("writer", "Review Writer", "review-writer@penned.local");
  const contentTypes = await getContentTypeOptions();
  const primaryType = contentTypes[0];
  const secondaryType = contentTypes[1] ?? contentTypes[0];

  if (!writer || !primaryType || !secondaryType) {
    return { ok: false, message: "Create at least two active content types before loading sample data." };
  }

  const acceptedOrder = await createSampleOrder({
    clientId: clientProfileId,
    clientLabel: "Acme Robotics",
    writerId: writer.id,
    contentTypeId: primaryType.id,
    budgetCents: primaryType.basePriceCents,
    title: CLIENT_SAMPLE_TITLES[0],
    brief: "Reference sample for client review: completed case study with proof points and a final approval state.",
    primaryCta: "Book a strategy call",
    targetAudience: "Operations leaders evaluating content systems",
    toneOfVoice: "Clear and strategic",
    targetKeywords: ["content operations", "editorial workflow"],
    priority: "standard",
    referenceLinks: ["https://example.com/case-study"],
    wordCount: 1400,
    dueDateOffsetDays: -3,
    status: "accepted",
  });

  const reviewOrder = await createSampleOrder({
    clientId: clientProfileId,
    clientLabel: "Northstar Growth",
    writerId: writer.id,
    contentTypeId: secondaryType.id,
    budgetCents: secondaryType.basePriceCents,
    title: CLIENT_SAMPLE_TITLES[1],
    brief: "Reference sample for client review: in-progress blog draft waiting in the review queue.",
    primaryCta: "Download the playbook",
    targetAudience: "B2B marketing teams",
    toneOfVoice: "Confident and practical",
    targetKeywords: ["workflow automation", "content systems"],
    priority: "priority",
    referenceLinks: ["https://example.com/blog-brief"],
    wordCount: 1200,
    dueDateOffsetDays: 4,
    status: "in_review",
  });

  if (!acceptedOrder || !reviewOrder) {
    return { ok: false, message: "Could not create sample client orders." };
  }

  await ensureSubmissionTree({
    orderId: acceptedOrder.id,
    writerId: writer.id,
    status: "accepted",
    notes: "Final draft approved and archived for reference.",
    googleDocUrl: "https://docs.google.com/document/d/sample-client-accepted",
    comments: [{ authorId: clientProfileId, body: "Looks great. Approved for publication." }],
  });

  await ensureSubmissionTree({
    orderId: reviewOrder.id,
    writerId: writer.id,
    status: "submitted",
    notes: "Draft one delivered and waiting on client feedback.",
    googleDocUrl: "https://docs.google.com/document/d/sample-client-review",
    comments: [{ authorId: writer.id, body: "Draft one is ready for review." }],
  });

  const wallet = await ensureWallet(writer.id);
  const ranking = await ensureRanking(writer.id);

  if (wallet && ranking) {
    await ensureAcceptedOrderCredit({
      walletId: wallet.id,
      walletAvailableCents: wallet.available_cents,
      rankingId: ranking.id,
      rankingScore: ranking.score,
      rankingCompletedJobs: ranking.completed_jobs,
      orderId: acceptedOrder.id,
      amountCents: acceptedOrder.budget_cents,
    });
  }

  revalidateApp();
  return { ok: true, message: "Two sample client orders are ready: one completed and one in review." };
}

async function seedWriterReviewData(writerProfileId: string): Promise<SeedWorkspaceDataResult> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const existing = await supabase
    .from("orders")
    .select("id, title")
    .eq("writer_id", writerProfileId);

  const existingTitles = new Set((existing.data ?? []).map((item) => item.title));
  if (WRITER_SAMPLE_TITLES.slice(0, 2).every((title) => existingTitles.has(title))) {
    return { ok: true, message: "Sample writer orders are already loaded." };
  }

  const client = await ensureSupportProfile("client", "Review Client", "review-client@penned.local", "Review Workspace");
  const contentTypes = await getContentTypeOptions();
  const primaryType = contentTypes[0];
  const secondaryType = contentTypes[1] ?? contentTypes[0];
  const tertiaryType = contentTypes[2] ?? contentTypes[0];

  if (!client || !primaryType || !secondaryType || !tertiaryType) {
    return { ok: false, message: "Create active content types before loading writer review data." };
  }

  const completedOrder = await createSampleOrder({
    clientId: client.id,
    clientLabel: "Verity Health",
    writerId: writerProfileId,
    contentTypeId: primaryType.id,
    budgetCents: primaryType.basePriceCents,
    title: WRITER_SAMPLE_TITLES[0],
    brief: "Completed writer sample used to show accepted work and wallet earnings.",
    primaryCta: "Schedule a walkthrough",
    targetAudience: "SaaS operations teams",
    toneOfVoice: "Polished and trustworthy",
    targetKeywords: ["ai operations", "content workflow"],
    priority: "standard",
    referenceLinks: ["https://example.com/writer-complete"],
    wordCount: 1500,
    dueDateOffsetDays: -5,
    status: "accepted",
  });

  const inProgressOrder = await createSampleOrder({
    clientId: client.id,
    clientLabel: "Atlas Security",
    writerId: writerProfileId,
    contentTypeId: secondaryType.id,
    budgetCents: secondaryType.basePriceCents,
    title: WRITER_SAMPLE_TITLES[1],
    brief: "In-progress writer sample that appears in active assignments.",
    primaryCta: "Book a demo",
    targetAudience: "Demand gen leads",
    toneOfVoice: "Sharp and conversion-minded",
    targetKeywords: ["campaign messaging", "landing page strategy"],
    priority: "priority",
    referenceLinks: ["https://example.com/writer-progress"],
    wordCount: 1100,
    dueDateOffsetDays: 3,
    status: "claimed",
  });

  await createSampleOrder({
    clientId: client.id,
    clientLabel: "Bluepeak Media",
    writerId: null,
    contentTypeId: tertiaryType.id,
    budgetCents: tertiaryType.basePriceCents,
    title: WRITER_SAMPLE_TITLES[2],
    brief: "Open marketplace sample to show how claimable jobs appear.",
    primaryCta: "Download the report",
    targetAudience: "RevOps teams",
    toneOfVoice: "Practical and concise",
    targetKeywords: ["revops automation", "reporting workflows"],
    priority: "rush",
    referenceLinks: ["https://example.com/writer-open"],
    wordCount: 900,
    dueDateOffsetDays: 5,
    status: "open",
  });

  if (!completedOrder || !inProgressOrder) {
    return { ok: false, message: "Could not create sample writer orders." };
  }

  await ensureSubmissionTree({
    orderId: completedOrder.id,
    writerId: writerProfileId,
    status: "accepted",
    notes: "Completed sample draft approved by the client.",
    googleDocUrl: "https://docs.google.com/document/d/sample-writer-accepted",
    comments: [{ authorId: client.id, body: "Approved. Great work on the final delivery." }],
  });

  const wallet = await ensureWallet(writerProfileId);
  const ranking = await ensureRanking(writerProfileId);

  if (wallet && ranking) {
    await ensureAcceptedOrderCredit({
      walletId: wallet.id,
      walletAvailableCents: wallet.available_cents,
      rankingId: ranking.id,
      rankingScore: ranking.score,
      rankingCompletedJobs: ranking.completed_jobs,
      orderId: completedOrder.id,
      amountCents: completedOrder.budget_cents,
    });
  }

  revalidateApp();
  return {
    ok: true,
    message: "Writer review data is ready with one completed order, one active assignment, and one open marketplace job.",
  };
}

async function ensureSupportProfile(role: Role, fullName: string, email: string, companyName?: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_name")
    .eq("email", email)
    .maybeSingle();

  if (existing) return existing;

  const { data } = await supabase
    .from("profiles")
    .insert({
      email,
      full_name: fullName,
      role,
      company_name: companyName ?? null,
    })
    .select("id, full_name, email, role, company_name")
    .single();

  return data;
}

async function createSampleOrder({
  clientId,
  clientLabel,
  writerId,
  contentTypeId,
  budgetCents,
  title,
  brief,
  primaryCta,
  targetAudience,
  toneOfVoice,
  targetKeywords,
  priority,
  referenceLinks,
  wordCount,
  dueDateOffsetDays,
  status,
}: {
  clientId: string;
  clientLabel: string;
  writerId: string | null;
  contentTypeId: string;
  budgetCents: number;
  title: string;
  brief: string;
  primaryCta: string;
  targetAudience: string;
  toneOfVoice: string;
  targetKeywords: string[];
  priority: string;
  referenceLinks: string[];
  wordCount: number;
  dueDateOffsetDays: number;
  status: string;
}) {
  const supabase = createServerSupabaseClient();

  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("orders")
    .select("id, budget_cents")
    .eq("title", title)
    .eq("client_id", clientId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDateOffsetDays);

  const { data } = await supabase
    .from("orders")
    .insert({
      client_id: clientId,
      client_label: clientLabel,
      writer_id: writerId,
      content_type_id: contentTypeId,
      title,
      brief,
      primary_cta: primaryCta,
      reference_links: referenceLinks,
      target_audience: targetAudience,
      tone_of_voice: toneOfVoice,
      target_keywords: targetKeywords,
      word_count: wordCount,
      priority,
      due_date: dueDate.toISOString().slice(0, 10),
      budget_cents: budgetCents,
      status,
    })
    .select("id, budget_cents")
    .single();

  return data;
}

async function ensureSubmissionTree({
  orderId,
  writerId,
  status,
  notes,
  googleDocUrl,
  comments,
}: {
  orderId: string;
  writerId: string;
  status: string;
  notes: string;
  googleDocUrl: string;
  comments: { authorId: string; body: string }[];
}) {
  const supabase = createServerSupabaseClient();

  if (!supabase) return;

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  const inserted = existing ?? (await supabase
    .from("submissions")
    .insert({
      order_id: orderId,
      writer_id: writerId,
      version: 1,
      google_doc_url: googleDocUrl,
      notes,
      status,
    })
    .select("id")
    .single()).data;

  if (!inserted?.id) return;

  const { data: existingComments } = await supabase
    .from("submission_comments")
    .select("id")
    .eq("submission_id", inserted.id);

  if ((existingComments ?? []).length === 0 && comments.length) {
    await supabase.from("submission_comments").insert(
      comments.map((comment) => ({
        submission_id: inserted.id,
        author_id: comment.authorId,
        body: comment.body,
      })),
    );
  }
}

async function ensureAcceptedOrderCredit({
  walletId,
  walletAvailableCents,
  rankingId,
  rankingScore,
  rankingCompletedJobs,
  orderId,
  amountCents,
}: {
  walletId: string;
  walletAvailableCents: number;
  rankingId: string;
  rankingScore: number;
  rankingCompletedJobs: number;
  orderId: string;
  amountCents: number;
}) {
  const supabase = createServerSupabaseClient();

  if (!supabase) return;

  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "earning")
    .maybeSingle();

  if (!existingTransaction) {
    await supabase.from("transactions").insert({
      wallet_id: walletId,
      order_id: orderId,
      type: "earning",
      amount_cents: amountCents,
    });

    await supabase
      .from("wallets")
      .update({
        available_cents: walletAvailableCents + amountCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", walletId);

    await supabase
      .from("rankings")
      .update({
        score: rankingScore + 10,
        completed_jobs: rankingCompletedJobs + 1,
        recalculated_at: new Date().toISOString(),
      })
      .eq("id", rankingId);
  }
}

export const RESERVE_MINUTES = 10;

export async function reserveOrder(orderId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, writer_id, reserved_by, reserved_until")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "open" || order.writer_id) {
    return { ok: false as const, message: "That job is no longer available." };
  }

  if (isReservedByOther(order, user.profileId)) {
    return { ok: false as const, message: "Another writer is holding this job right now. Try again shortly." };
  }

  const nowIso = new Date().toISOString();
  const reservedUntil = new Date(Date.now() + RESERVE_MINUTES * 60_000).toISOString();
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ reserved_by: user.profileId, reserved_until: reservedUntil })
    .eq("id", orderId)
    .eq("status", "open")
    .is("writer_id", null)
    .or(`reserved_by.is.null,reserved_by.eq.${user.profileId},reserved_until.is.null,reserved_until.lte.${nowIso}`)
    .select("id");

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (!updated?.length) {
    return { ok: false as const, message: "Another writer got there first." };
  }

  revalidateApp();
  return {
    ok: true as const,
    message: `Reserved for ${RESERVE_MINUTES} minutes. Confirm the claim before the hold expires.`,
  };
}

export async function claimOrder(orderId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, writer_id, reserved_by, reserved_until")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "open" || order.writer_id) {
    return { ok: false as const, message: "That job is no longer available." };
  }

  // A live reservation by someone else blocks the claim; our own reservation (or an expired one) does not.
  if (isReservedByOther(order, user.profileId)) {
    return { ok: false as const, message: "Another writer is holding this job right now. Try again shortly." };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      writer_id: user.profileId,
      status: "claimed",
      reserved_by: null,
      reserved_until: null,
      updated_at: nowIso,
    })
    .eq("id", orderId)
    .eq("status", "open")
    .is("writer_id", null)
    .or(`reserved_by.is.null,reserved_by.eq.${user.profileId},reserved_until.is.null,reserved_until.lte.${nowIso}`)
    .select("id");

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (!updated?.length) {
    return { ok: false as const, message: "Another writer claimed this job first." };
  }

  await ensureWallet(user.profileId);
  await ensureRanking(user.profileId);
  revalidateApp();
  return { ok: true as const, message: "Job claimed. It is now in your assigned jobs." };
}

/**
 * The orders.status enum has no "in_progress" value, so "started" is tracked in
 * intake_details.writer_started while the order stays "claimed".
 */
export async function markJobInProgress(orderId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, writer_id, intake_details")
    .eq("id", orderId)
    .eq("writer_id", user.profileId)
    .maybeSingle();

  if (!order) {
    return { ok: false as const, message: "Job not found." };
  }

  if (isJobStarted(order.intake_details)) {
    return { ok: true as const, message: "This job is already in progress." };
  }

  if (order.status !== "claimed") {
    return { ok: false as const, message: "Only claimed jobs can be started." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      intake_details: {
        ...((order.intake_details ?? {}) as Record<string, unknown>),
        writer_started: true,
        writer_started_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidateApp();
  return { ok: true as const, message: "Job marked as in progress." };
}

function isReservedByOther(
  order: { reserved_by: string | null; reserved_until: string | null },
  profileId: string,
) {
  return Boolean(
    order.reserved_by &&
      order.reserved_by !== profileId &&
      order.reserved_until &&
      new Date(order.reserved_until).getTime() > Date.now(),
  );
}

function isJobStarted(intakeDetails: unknown) {
  return Boolean(
    intakeDetails &&
      typeof intakeDetails === "object" &&
      (intakeDetails as Record<string, unknown>).writer_started === true,
  );
}

export async function submitDraft(
  orderId: string,
  googleDocUrl: string,
  notes: string,
) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const { data: ownedOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("writer_id", user.profileId)
    .maybeSingle();

  if (!ownedOrder) {
    return { ok: false as const, message: "You can only submit drafts for jobs assigned to you." };
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("version")
    .eq("order_id", orderId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existing?.version ?? 0) + 1;

  const { error } = await supabase.from("submissions").insert({
    order_id: orderId,
    writer_id: user.profileId,
    version: nextVersion,
    google_doc_url: googleDocUrl,
    notes,
    status: existing ? "resubmitted" : "submitted",
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await supabase
    .from("orders")
    .update({
      status: "in_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidateApp();
  return { ok: true as const, message: "Draft submitted for review." };
}

export async function addSubmissionComment(submissionId: string, body: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user) {
    return { ok: false as const, message: "A role must be selected." };
  }

  const { error } = await supabase.from("submission_comments").insert({
    submission_id: submissionId,
    author_id: user.profileId,
    body,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidateApp();
  return { ok: true as const, message: "Comment added." };
}

export async function requestRevision(
  orderId: string,
  submissionId: string,
  feedback: string,
) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "client") {
    return { ok: false as const, message: "Client access is required." };
  }

  await supabase
    .from("submission_comments")
    .insert({
      submission_id: submissionId,
      author_id: user.profileId,
      body: feedback,
    });

  await supabase
    .from("submissions")
    .update({ status: "revision_requested" })
    .eq("id", submissionId);

  await supabase
    .from("orders")
    .update({
      status: "revision_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  revalidateApp();
  return { ok: true as const, message: "Revision requested." };
}

export async function acceptSubmission(orderId: string, submissionId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "client") {
    return { ok: false as const, message: "Client access is required." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("writer_id, budget_cents")
    .eq("id", orderId)
    .single();

  if (!order?.writer_id) {
    return { ok: false as const, message: "No writer is assigned to this order yet." };
  }

  await supabase
    .from("submissions")
    .update({ status: "accepted" })
    .eq("id", submissionId);

  await supabase
    .from("orders")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const wallet = await ensureWallet(order.writer_id);

  if (!wallet) {
    return { ok: false as const, message: "Writer wallet could not be initialized." };
  }

  await supabase.from("transactions").insert({
    wallet_id: wallet.id,
    order_id: orderId,
    type: "earning",
    amount_cents: order.budget_cents || 0,
  });

  await supabase
    .from("wallets")
    .update({
      available_cents: wallet.available_cents + (order.budget_cents || 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  const ranking = await ensureRanking(order.writer_id);

  if (!ranking) {
    return { ok: false as const, message: "Writer ranking could not be initialized." };
  }

  await supabase
    .from("rankings")
    .update({
      score: ranking.score + 10,
      completed_jobs: ranking.completed_jobs + 1,
      recalculated_at: new Date().toISOString(),
    })
    .eq("id", ranking.id);

  revalidateApp();
  return { ok: true as const, message: "Submission accepted and writer credited." };
}

export async function requestPayout(amountDollars: number) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const wallet = await ensureWallet(user.profileId);
  const amountCents = Math.round(amountDollars * 100);

  if (!wallet) {
    return { ok: false as const, message: "Wallet could not be initialized." };
  }

  if (amountCents <= 0) {
    return { ok: false as const, message: "Payout amount must be greater than zero." };
  }

  if (wallet.available_cents < amountCents) {
    return { ok: false as const, message: "Requested amount exceeds available balance." };
  }

  const { error } = await supabase.from("payout_requests").insert({
    writer_id: user.profileId,
    amount_cents: amountCents,
    status: "pending",
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidateApp();
  return { ok: true as const, message: "Payout request submitted for approval." };
}

export async function approvePayout(payoutRequestId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "admin") {
    return { ok: false as const, message: "Admin access is required." };
  }

  const { data: request } = await supabase
    .from("payout_requests")
    .select("id, writer_id, amount_cents, status")
    .eq("id", payoutRequestId)
    .single();

  if (!request || request.status !== "pending") {
    return { ok: false as const, message: "Payout request is no longer pending." };
  }

  const wallet = await ensureWallet(request.writer_id);

  if (!wallet) {
    return { ok: false as const, message: "Writer wallet could not be initialized." };
  }

  if (wallet.available_cents < request.amount_cents) {
    return { ok: false as const, message: "Writer balance is too low to approve this payout." };
  }

  await supabase
    .from("payout_requests")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.profileId,
    })
    .eq("id", payoutRequestId);

  await supabase
    .from("wallets")
    .update({
      available_cents: wallet.available_cents - request.amount_cents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  await supabase.from("transactions").insert({
    wallet_id: wallet.id,
    type: "payout",
    amount_cents: -request.amount_cents,
  });

  revalidateApp();
  return { ok: true as const, message: "Payout approved and balance updated." };
}

async function getLatestSubmission(orderId: string): Promise<SubmissionVersion | null> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, version, status, notes, google_doc_url, submitted_at")
    .eq("order_id", orderId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!submission) {
    return null;
  }

  const { data: comments } = await supabase
    .from("submission_comments")
    .select(
      `
        id,
        body,
        created_at,
        author:profiles!submission_comments_author_id_fkey(full_name)
      `,
    )
    .eq("submission_id", submission.id)
    .order("created_at", { ascending: true });

  return {
    id: submission.id,
    status: formatOrderStatus(submission.status),
    notes: submission.notes ?? "No notes attached.",
    googleDocUrl: submission.google_doc_url ?? "",
    submittedAt: formatRelativeDate(submission.submitted_at),
    version: submission.version,
    comments: (comments ?? []).map((comment) => ({
      id: comment.id,
      author: readSingleRelation(comment.author)?.full_name ?? "Team member",
      body: comment.body,
      createdAt: formatRelativeDate(comment.created_at),
    })),
  };
}

async function ensureWallet(writerProfileId: string) {
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase!
    .from("wallets")
    .select("id, available_cents, pending_cents")
    .eq("writer_id", writerProfileId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data } = await supabase!
    .from("wallets")
    .insert({
      writer_id: writerProfileId,
      available_cents: 0,
      pending_cents: 0,
    })
    .select("id, available_cents, pending_cents")
    .single();

  return data;
}

async function ensureRanking(writerProfileId: string) {
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase!
    .from("rankings")
    .select("id, score, completed_jobs")
    .eq("writer_id", writerProfileId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data } = await supabase!
    .from("rankings")
    .insert({
      writer_id: writerProfileId,
      score: 0,
      rating: 0,
      quality_deductions: 0,
      completed_jobs: 0,
    })
    .select("id, score, completed_jobs")
    .single();

  return data;
}

function splitLinesAndCommas(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createBulkOrders(
  rows: {
    client: string;
    contentType: string;
    tier: "on-demand" | "rank";
    title: string;
    wordCount: number;
    language: string;
    keywords: string;
    folderId: string;
  }[],
  paymentSource: string,
) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "client") {
    return { ok: false as const, message: "Sign in as a client before submitting a batch." };
  }

  if (!rows.length) {
    return { ok: false as const, message: "Add at least one row before submitting a batch." };
  }

  const contentTypes = await getContentTypeOptions();
  const folders = await getClientFolders(user.profileId);
  const batchId = `B${Date.now().toString().slice(-6)}`;
  const payloads = [];

  for (const [index, row] of rows.entries()) {
    const contentType = contentTypes.find((type) => type.name === row.contentType && type.isOrderable);
    const folder = folders.find((item) => item.id === row.folderId);
    if (!contentType) {
      return { ok: false as const, message: `Row ${index + 1}: choose an active content type.` };
    }
    if (!folder) {
      return { ok: false as const, message: `Row ${index + 1}: choose a client folder.` };
    }

    const rate = contentType.basePriceCents + (row.tier === "rank" ? 10 : 0);
    payloads.push({
      client_id: user.profileId,
      client_label: row.client.trim() || folder.name,
      client_folder_id: folder.id,
      content_type_id: contentType.id,
      title: row.title.trim(),
      brief: "",
      primary_cta: "",
      reference_links: [],
      target_audience: folder.targetAudience,
      tone_of_voice: folder.toneGuide,
      target_keywords: splitLinesAndCommas(row.keywords),
      word_count: row.wordCount,
      priority: "standard",
      due_date: null,
      budget_cents: row.wordCount * rate,
      language: row.language || "English",
      service_tier: row.tier,
      intake_details: {
        _batchId: batchId,
        _paymentSource: paymentSource,
      },
      status: "open",
    });
  }

  const { error } = await supabase.from("orders").insert(payloads);
  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidateApp();
  return {
    ok: true as const,
    message: `Batch #${batchId} — ${rows.length} content orders submitted.`,
  };
}

function validateServiceFields(service: ServiceDefinition, fields: Record<string, string>) {
  const errors: string[] = [];

  for (const field of service.fields) {
    if (!field.required) {
      continue;
    }

    if (field.showWhen && fields[field.showWhen.field] !== field.showWhen.equals) {
      continue;
    }

    const value = fields[field.id]?.trim() ?? "";
    if (!value) {
      errors.push(`${field.label} is required for ${service.name}.`);
    }
  }

  return errors;
}

function formatOrderStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDeadline(date: string | null) {
  if (!date) {
    return "No due date";
  }

  return `Due ${formatDate(date)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatRelativeDate(date: string) {
  const value = new Date(date);
  return `${formatDate(value.toISOString())}`;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function humanizeTransactionType(type: string) {
  switch (type) {
    case "earning":
      return "Order earning";
    case "payout":
      return "Payout sent";
    default:
      return formatOrderStatus(type);
  }
}

function readSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/client");
  revalidatePath("/writer");
  revalidatePath("/writer", "layout");
  revalidatePath("/admin");
}
