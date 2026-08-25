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
  pay: string;
  turnaround: string;
  status: string;
};

export type WriterAssignment = {
  id: string;
  title: string;
  client: string;
  status: string;
  deadline: string;
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

export type WriterOrderDetail = {
  id: string;
  title: string;
  client: string;
  contentType: string;
  status: string;
  deadline: string;
  brief: string;
  toneOfVoice: string;
  targetKeywords: string[];
  wordCount: string;
  priority: string;
  primaryCta: string;
  referenceLinks: string[];
  latestSubmission: SubmissionVersion | null;
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

export async function getWriterMarketplace(): Promise<MarketplaceOrder[]> {
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
        due_date,
        budget_cents,
        status,
        target_audience,
        client:profiles!orders_client_id_fkey(company_name, full_name)
      `,
    )
    .in("status", ["open", "claimed", "revision_requested"])
    .order("created_at", { ascending: false });

  return (data ?? []).map((order) => {
    const client = readSingleRelation(order.client);

    return {
      id: order.id,
      title: order.title,
      client: client?.company_name ?? client?.full_name ?? "Penned client",
      industry: order.target_audience ?? "General business",
      pay: order.budget_cents ? formatCurrency(order.budget_cents) : "TBD",
      turnaround: formatDeadline(order.due_date),
      status: formatOrderStatus(order.status),
    };
  });
}

export async function getWriterAssignments(
  writerProfileId: string,
): Promise<WriterAssignment[]> {
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
    .eq("writer_id", writerProfileId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((order) => {
    const client = readSingleRelation(order.client);

    return {
      id: order.id,
      title: order.title,
      client: client?.company_name ?? client?.full_name ?? "Client",
      status: formatOrderStatus(order.status),
      deadline: formatDeadline(order.due_date),
    };
  });
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
        priority,
        reference_links,
        client:profiles!orders_client_id_fkey(company_name, full_name),
        content_types(name)
      `,
    )
    .eq("id", orderId)
    .eq("writer_id", writerProfileId)
    .maybeSingle();

  if (!order) {
    return null;
  }

  const latestSubmission = await getLatestSubmission(orderId);
  const client = readSingleRelation(order.client);

  return {
    id: order.id,
    title: order.title,
    client: client?.company_name ?? client?.full_name ?? "Client",
    contentType: readSingleRelation(order.content_types)?.name ?? "Content order",
    status: formatOrderStatus(order.status),
    deadline: formatDeadline(order.due_date),
    brief: order.brief,
    toneOfVoice: order.tone_of_voice ?? "Not specified",
    targetKeywords: order.target_keywords ?? [],
    wordCount: order.word_count ? `${order.word_count} words` : "Not specified",
    priority: order.priority ? formatOrderStatus(order.priority) : "Standard",
    primaryCta: order.primary_cta ?? "Not specified",
    referenceLinks: order.reference_links ?? [],
    latestSubmission,
  };
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

export async function claimOrder(orderId: string) {
  const supabase = createServerSupabaseClient();
  const user = await getCurrentAppUser();

  if (!supabase || !user || user.role !== "writer") {
    return { ok: false as const, message: "Writer access is required." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      writer_id: user.profileId,
      status: "claimed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "open");

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await ensureWallet(user.profileId);
  await ensureRanking(user.profileId);
  revalidateApp();
  return { ok: true as const, message: "Job claimed successfully." };
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
  revalidatePath("/admin");
}
