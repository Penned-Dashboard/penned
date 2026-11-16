/**
 * Email notifications. Each `notify…` function is called right after the
 * action it describes has been saved. They look up who should be told, build
 * the emails and send them through Resend (see email.ts).
 *
 * Rules that live here:
 * - Nothing here may throw into the calling action. Use `queueNotification`.
 * - Clients can turn order updates off, or choose one daily summary
 *   (profiles.notification_prefs.client_email, see email-prefs.ts).
 * - Bulk orders (orders sharing intake_details._batchId) never send one email
 *   per piece: first draft ready, a daily summary, all drafts ready, batch complete.
 * - Writers' saved email preferences (writer settings) are respected.
 */

import { after } from "next/server";
import { emailConfigured, sendEmails, type OutgoingEmail } from "@/lib/email";
import { readClientEmailPrefs, writeClientEmailPrefs } from "@/lib/email-prefs";
import {
  addInAppNotifications,
  resolveInAppNotifications,
  type NewInAppNotification,
} from "@/lib/in-app-notifications";
import * as templates from "@/lib/email-templates";
import { renderEmail, type EmailContent, type EmailLink, type OrderSummary } from "@/lib/email-templates";
import { resolveWorkflowStatus } from "@/lib/order-workflow";
import { formatUsdFromCents } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redactContactDetails } from "@/lib/writer-privacy";
import { normalizeNotificationPrefs } from "@/lib/writer-status";

type Row = Record<string, unknown>;

export type Person = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  company: string;
  role: string;
  notificationPrefs: unknown;
  createdAt: string;
  onboardingAnswers: unknown;
};

/* ------------------------------------------------------------------ */
/* Plumbing                                                            */
/* ------------------------------------------------------------------ */

/**
 * Run a notification after the response has been sent, so email never slows
 * down or breaks the action that triggered it.
 */
export function queueNotification(task: () => Promise<unknown>) {

  const safe = async () => {
    try {
      await task();
    } catch (error) {
      console.error("Notification failed", error instanceof Error ? error.message : error);
    }
  };

  try {
    after(safe);
  } catch {
    // Not inside a request (for example a script): run it now.
    void safe();
  }
}

function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://app.penned.io");
  return `${base.replace(/\/$/, "")}${path}`;
}

export const urls = {
  clientOrder: (orderId: string) => appUrl(`/client/orders/${orderId}`),
  clientOrders: () => appUrl("/client/orders"),
  clientNewOrder: () => appUrl("/client/new-order"),
  clientBudget: () => appUrl("/client/content-budget"),
  clientSettings: () => appUrl("/client/settings"),
  writerHome: () => appUrl("/writer"),
  writerOrder: (orderId: string) => appUrl(`/writer/orders/${orderId}`),
  writerEarnings: () => appUrl("/writer/earnings"),
  writerMarketplace: () => appUrl("/writer/marketplace"),
  editorHome: () => appUrl("/editor"),
  teamBriefs: (role: string) =>
    appUrl(role === "admin" ? "/admin/orders" : "/account-manager/briefs"),
  teamOrders: (role: string) =>
    appUrl(role === "admin" ? "/admin/orders" : "/account-manager/orders"),
  teamClients: (role: string) =>
    appUrl(role === "admin" ? "/admin/clients" : "/account-manager/clients"),
  adminPayouts: () => appUrl("/admin/payouts"),
};

/** Dashboard path of one of the absolute `urls` above (in-app notifications link inside the app). */
function pathOf(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return "/notifications";
  }
}

/**
 * Bell notifications. Separate from email on purpose: turning emails off does
 * not hide things that need attention inside the dashboard.
 */
async function bell(people: (Person | null | undefined)[], item: Omit<NewInAppNotification, "profileId">) {
  await addInAppNotifications(
    people.filter((person): person is Person => Boolean(person?.id)).map((person) => ({ profileId: person.id, ...item })),
  );
}

function clipText(value: string, max = 140) {
  const single = value.replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

/** Accounts that see team notifications in the bell: account managers and admins. */
export async function getTeamProfiles(): Promise<Person[]> {
  return getPeopleByRole(["account_manager", "admin"]);
}

function teamPath(person: Person, kind: "briefs" | "orders" | "clients") {
  if (kind === "briefs") return pathOf(urls.teamBriefs(person.role));
  if (kind === "clients") return pathOf(urls.teamClients(person.role));
  return pathOf(urls.teamOrders(person.role));
}

function str(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asRecord(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
}

function toPerson(row: Row): Person {
  const fullName = str(row.full_name).trim();
  return {
    id: str(row.id),
    email: str(row.email).trim(),
    fullName: fullName || "there",
    firstName: fullName.split(/\s+/)[0] || "there",
    company: str(row.company_name).trim(),
    role: str(row.role),
    notificationPrefs: row.notification_prefs,
    createdAt: str(row.created_at),
    onboardingAnswers: row.onboarding_answers,
  };
}

export async function getPerson(profileId: string): Promise<Person | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase || !profileId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  return data ? toPerson(data as Row) : null;
}

/** Everyone with one of these roles. A role missing from the database enum is skipped. */
async function getPeopleByRole(roles: string[]): Promise<Person[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const people = new Map<string, Person>();
  for (const role of roles) {
    const { data, error } = await supabase.from("profiles").select("*").eq("role", role).limit(200);
    if (error || !data) continue;
    for (const row of data as Row[]) {
      const person = toPerson(row);
      if (person.email && !people.has(person.email.toLowerCase())) {
        people.set(person.email.toLowerCase(), person);
      }
    }
  }
  return [...people.values()];
}

/**
 * Who gets admin emails: the addresses in ADMIN_NOTIFICATION_EMAILS (for
 * example the support inbox), or every admin account when that isn't set.
 */
export async function getAdminRecipients(): Promise<Person[]> {
  const configured = (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.includes("@"));
  if (configured.length) {
    return configured.map((email) => ({
      id: "",
      email,
      fullName: "Penned team",
      firstName: "there",
      company: "",
      role: "admin",
      notificationPrefs: null,
      createdAt: "",
      onboardingAnswers: null,
    }));
  }
  return getPeopleByRole(["admin"]);
}

/** Account managers, or the admin recipients when there are no account managers yet. */
export async function getOrderTeam(): Promise<Person[]> {
  const managers = await getPeopleByRole(["account_manager"]);
  return managers.length ? managers : getAdminRecipients();
}

/** Everyone with this role (exported for the reminder job). */
export async function getPeopleWithRole(role: string): Promise<Person[]> {
  return getPeopleByRole([role]);
}

/**
 * Record that a one-off email has been sent, so it is never sent twice.
 * Returns false if the key was already used. Without the notification_log
 * table it returns true, so nothing is blocked (but nothing is de-duplicated).
 */
export async function claimNotificationKey(key: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("notification_log").insert({ key });
  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("notification_log insert failed", error.message);
  return false;
}

async function getOrderRow(orderId: string): Promise<Row | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase || !orderId) return null;
  const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  return (data as Row | null) ?? null;
}

async function getContentTypeNames(ids: string[]) {
  const supabase = createServerSupabaseClient();
  const names = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!supabase || !unique.length) return names;
  const { data } = await supabase.from("content_types").select("id, name").in("id", unique);
  for (const row of (data ?? []) as Row[]) names.set(str(row.id), str(row.name));
  return names;
}

export function formatDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  // Date-only values (the client's optional due date) have no time to show.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
  const text = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
  return `${text.replace(" at ", ", ")} UK time`;
}

function deliveryLabel(priority: unknown) {
  const value = str(priority);
  if (value === "rush") return "rush delivery";
  if (value === "priority") return "priority delivery";
  return "standard delivery";
}

function summarise(
  order: Row,
  contentTypes: Map<string, string>,
  audience: "client" | "writer" | "team",
): OrderSummary {
  const id = str(order.id);
  const due =
    audience === "writer"
      ? order.writer_due_at ?? order.due_date
      : order.client_due_at ?? order.due_date;
  const cents = Number(order.budget_cents ?? 0);
  return {
    title: str(order.title) || "Untitled order",
    contentType: contentTypes.get(str(order.content_type_id)) ?? "",
    wordCount: Number(order.word_count ?? 0) || null,
    language: str(order.language),
    dueLabel: formatDate(due),
    costLabel: audience === "client" && cents > 0 ? formatUsdFromCents(cents) : "",
    url: audience === "writer" ? urls.writerOrder(id) : urls.clientOrder(id),
  };
}

function batchIdOf(order: Row) {
  return str(asRecord(order.intake_details)._batchId);
}

export function build(to: string, content: EmailContent): OutgoingEmail {
  return { to, ...renderEmail(content) };
}

export function writerWantsInApp(writer: Person, eventKey: string) {
  const prefs = normalizeNotificationPrefs(writer.notificationPrefs);
  return prefs[eventKey]?.inApp !== false;
}

export function writerWantsEmail(writer: Person, eventKey: string) {
  const prefs = normalizeNotificationPrefs(writer.notificationPrefs);
  return prefs[eventKey]?.email !== false;
}

/* ------------------------------------------------------------------ */
/* Draft state for a client's orders (bulk rules and the daily summary) */
/* ------------------------------------------------------------------ */

type DraftState = {
  orderId: string;
  title: string;
  status: string;
  batchId: string;
  hasDraft: boolean;
  /** Latest draft is with the client and not yet approved or sent back. */
  waiting: boolean;
  latestSubmittedAt: string;
};

async function getClientDraftStates(clientId: string): Promise<DraftState[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("id, title, status, intake_details")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(500);

  const orderRows = (orders ?? []) as Row[];
  if (!orderRows.length) return [];

  const { data: submissions } = await supabase
    .from("submissions")
    .select("order_id, version, status, submitted_at")
    .in(
      "order_id",
      orderRows.map((order) => str(order.id)),
    );

  const latest = new Map<string, Row>();
  for (const submission of (submissions ?? []) as Row[]) {
    const key = str(submission.order_id);
    const current = latest.get(key);
    if (!current || Number(submission.version ?? 0) > Number(current.version ?? 0)) {
      latest.set(key, submission);
    }
  }

  return orderRows.map((order) => {
    const id = str(order.id);
    const submission = latest.get(id);
    const status = str(order.status);
    const submissionStatus = str(submission?.status);
    return {
      orderId: id,
      title: str(order.title) || "Untitled order",
      status,
      batchId: batchIdOf(order),
      hasDraft: Boolean(submission),
      waiting:
        Boolean(submission) &&
        ["submitted", "resubmitted"].includes(submissionStatus) &&
        !["accepted", "cancelled", "revision_requested"].includes(status),
      latestSubmittedAt: str(submission?.submitted_at),
    };
  });
}

function batchProgress(states: DraftState[], batchId: string) {
  const batch = states.filter((state) => state.batchId === batchId && state.status !== "cancelled");
  return {
    total: batch.length,
    ready: batch.filter((state) => state.hasDraft).length,
    approved: batch.filter((state) => state.status === "accepted").length,
  };
}

function waitingLinks(states: DraftState[]): EmailLink[] {
  return states
    .filter((state) => state.waiting)
    .slice(0, 40)
    .map((state) => ({ label: state.title, url: urls.clientOrder(state.orderId) }));
}

async function saveClientEmailState(
  clientId: string,
  change: { lastSummaryAt?: string; announced?: string[] },
) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return;
  const { data } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", clientId)
    .maybeSingle();
  const current = (data as Row | null)?.notification_prefs;
  const next = writeClientEmailPrefs(current, {
    ...(change.lastSummaryAt ? { lastSummaryAt: change.lastSummaryAt } : {}),
  });
  const entry = asRecord(next.client_email);
  if (change.announced) entry.announced = change.announced.slice(-60);
  next.client_email = entry;
  await supabase.from("profiles").update({ notification_prefs: next }).eq("id", clientId);
}

function announcedIds(client: Person): string[] {
  const value = asRecord(asRecord(client.notificationPrefs).client_email).announced;
  return Array.isArray(value) ? value.map(str) : [];
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

/** New client account: welcome the client, tell admins and account managers. */
export async function notifySignUp(profileId: string) {
  const person = await getPerson(profileId);
  if (!person || person.role !== "client") return;

  // createWorkspaceUser also returns existing accounts; only greet new ones.
  const created = new Date(person.createdAt).getTime();
  if (!Number.isFinite(created) || Date.now() - created > 10 * 60 * 1000) return;

  const emails: OutgoingEmail[] = [
    build(
      person.email,
      templates.clientWelcome({ firstName: person.firstName, newOrderUrl: urls.clientNewOrder() }),
    ),
  ];

  const answers = asRecord(person.onboardingAnswers);
  const list = (value: unknown) => (Array.isArray(value) ? value.map(str).filter(Boolean).join(", ") : "");
  const answerLines = [
    list(answers.contentNeeds) ? `Needs: ${list(answers.contentNeeds)}` : "",
    list(answers.industries) ? `Industries: ${list(answers.industries)}` : "",
    str(answers.contentSource) ? `Content comes from: ${str(answers.contentSource)}` : "",
  ].filter(Boolean);

  // Admin is told straight away; account managers see new clients in the morning summary.
  for (const member of await getAdminRecipients()) {
    emails.push(
      build(
        member.email,
        templates.teamNewClient({
          clientName: person.fullName,
          clientEmail: person.email,
          clientCompany: person.company,
          answers: answerLines,
          clientsUrl: urls.teamClients(member.role),
        }),
      ),
    );
  }

  for (const admin of await getPeopleByRole(["admin"])) {
    await bell([admin], {
      title: `New client: ${person.fullName}`,
      body: [person.company, person.email].filter(Boolean).join(" · "),
      href: teamPath(admin, "clients"),
      kind: "new_client",
    });
  }

  await sendEmails(emails);
}

/** An admin changed someone's role: welcome new writers and editors. */
export async function notifyRoleChanged(profileId: string, previousRole: string, nextRole: string) {
  if (previousRole === nextRole) return;
  const person = await getPerson(profileId);
  if (!person) return;

  if (nextRole === "writer") {
    await sendEmails([
      build(
        person.email,
        templates.writerWelcome({ firstName: person.firstName, dashboardUrl: urls.writerHome() }),
      ),
    ]);
  } else if (nextRole === "editor") {
    await sendEmails([
      build(
        person.email,
        templates.editorWelcome({ firstName: person.firstName, dashboardUrl: urls.editorHome() }),
      ),
    ]);
  }
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

/** One order, or every order of a bulk batch, has just been placed. */
export async function notifyOrdersPlaced(orderIds: string[]) {
  const supabase = createServerSupabaseClient();
  const ids = orderIds.filter(Boolean);
  if (!supabase || !ids.length) return;

  const { data } = await supabase.from("orders").select("*").in("id", ids);
  const orders = (data ?? []) as Row[];
  if (!orders.length) return;

  const client = await getPerson(str(orders[0].client_id));
  if (!client) return;

  const contentTypes = await getContentTypeNames(orders.map((order) => str(order.content_type_id)));
  const emails: OutgoingEmail[] = [];
  const prefs = readClientEmailPrefs(client.notificationPrefs);

  if (prefs.enabled) {
    if (orders.length === 1) {
      emails.push(
        build(
          client.email,
          templates.clientOrderReceived({
            firstName: client.firstName,
            order: summarise(orders[0], contentTypes, "client"),
            settingsUrl: urls.clientSettings(),
          }),
        ),
      );
    } else {
      const totalCents = orders.reduce((sum, order) => sum + Number(order.budget_cents ?? 0), 0);
      emails.push(
        build(
          client.email,
          templates.clientBatchReceived({
            firstName: client.firstName,
            orders: orders.map((order) => summarise(order, contentTypes, "client")),
            totalCostLabel: totalCents > 0 ? formatUsdFromCents(totalCents) : "",
            ordersUrl: urls.clientOrders(),
            settingsUrl: urls.clientSettings(),
          }),
        ),
      );
    }
  }

  // Account managers and admin are both told (once each, even if they overlap).
  const seen = new Set<string>();
  const recipients = [...(await getOrderTeam()), ...(await getAdminRecipients())].filter((person) => {
    const email = person.email.toLowerCase();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  for (const member of recipients) {
    emails.push(
      build(
        member.email,
        templates.teamNewOrders({
          clientName: client.fullName,
          clientCompany: client.company,
          orders: orders.map((order) => ({
            ...summarise(order, contentTypes, "team"),
            delivery: deliveryLabel(order.priority),
          })),
          briefsUrl: urls.teamBriefs(member.role),
        }),
      ),
    );
  }

  const who = client.company ? `${client.fullName}, ${client.company}` : client.fullName;
  for (const member of await getTeamProfiles()) {
    await bell([member], {
      title:
        orders.length === 1
          ? `New order to check: ${str(orders[0].title) || "Untitled order"}`
          : `New bulk order to check: ${orders.length} pieces`,
      body: who,
      href: teamPath(member, "briefs"),
      kind: "new_order",
    });
  }

  await sendEmails(emails);
}

/** A writer claimed an order. */
export async function notifyOrderClaimed(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const writer = await getPerson(str(order.writer_id));
  if (!writer) return;
  const contentTypes = await getContentTypeNames([str(order.content_type_id)]);

  await sendEmails([
    build(
      writer.email,
      templates.writerOrderClaimed({
        firstName: writer.firstName,
        order: summarise(order, contentTypes, "writer"),
      }),
    ),
  ]);
}

/**
 * A writer submitted a draft. If the order is in the editing queue the
 * editors are told; otherwise the client can already see it, so the client is.
 */
export async function notifyDraftSubmitted(orderId: string) {
  const supabase = createServerSupabaseClient();
  const order = await getOrderRow(orderId);
  if (!supabase || !order) return;

  // The writer has delivered: clear their reminders for this order.
  await resolveInAppNotifications(str(order.writer_id), pathOf(urls.writerOrder(orderId)));

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);
  const resubmitted = (count ?? 0) > 1;

  const stage = resolveWorkflowStatus({
    dbStatus: str(order.status),
    workflowStatus: str(order.workflow_status) || null,
  });

  if (stage === "with_editor") {
    const writer = await getPerson(str(order.writer_id));
    const contentTypes = await getContentTypeNames([str(order.content_type_id)]);
    // The assigned editor only; every editor while nobody is assigned.
    const assigned = str(order.editor_id) ? await getPerson(str(order.editor_id)) : null;
    const editors = assigned ? [assigned] : await getPeopleByRole(["editor"]);
    await bell(editors, {
      title: `${resubmitted ? "Resubmitted" : "Ready to edit"}: ${str(order.title) || "Untitled order"}`,
      body: formatDate(order.client_due_at) ? `Due to the client by ${formatDate(order.client_due_at)}.` : "",
      href: pathOf(urls.editorHome()),
      kind: "edit_ready",
    });
    await sendEmails(
      editors.map((editor) =>
        build(
          editor.email,
          templates.editorDraftReady({
            firstName: editor.firstName,
            order: summarise(order, contentTypes, "team"),
            writerName: writer?.fullName ?? "The writer",
            resubmitted,
            queueUrl: urls.editorHome(),
          }),
        ),
      ),
    );
    return;
  }

  await notifyClientDraftReady(order, resubmitted);
}

/** An editor approved a draft, so the client can now review it. */
export async function notifyEditorApproved(orderId: string) {
  const supabase = createServerSupabaseClient();
  const order = await getOrderRow(orderId);
  if (!supabase || !order) return;

  const { data } = await supabase.from("submissions").select("status").eq("order_id", orderId);
  const revised = ((data ?? []) as Row[]).some(
    (submission) => str(submission.status) === "revision_requested",
  );
  await notifyClientDraftReady(order, revised);
}

async function notifyClientDraftReady(order: Row, revised: boolean) {
  const client = await getPerson(str(order.client_id));
  if (!client) return;

  // The bell always shows a draft to review, whatever the email settings.
  await bell([client], {
    title: `${revised ? "Revised draft ready" : "Draft ready to review"}: ${str(order.title) || "Untitled order"}`,
    body: revised ? "Your writer has made the changes you asked for." : "Approve it or ask for changes.",
    href: pathOf(urls.clientOrder(str(order.id))),
    kind: "draft_ready",
  });

  const prefs = readClientEmailPrefs(client.notificationPrefs);
  if (!prefs.enabled) return;

  const orderId = str(order.id);
  const title = str(order.title) || "Untitled order";
  const batchId = batchIdOf(order);
  const settingsUrl = urls.clientSettings();

  if (batchId) {
    const states = await getClientDraftStates(client.id);
    const progress = batchProgress(states, batchId);

    if (progress.total > 1) {
      // Revised drafts in a bulk order wait for the daily summary.
      if (revised) return;

      if (progress.ready === 1) {
        await sendEmails([
          build(
            client.email,
            templates.clientBatchFirstReady({
              firstName: client.firstName,
              orderTitle: title,
              orderUrl: urls.clientOrder(orderId),
              total: progress.total,
              settingsUrl,
            }),
          ),
        ]);
        await saveClientEmailState(client.id, { announced: [...announcedIds(client), orderId] });
        return;
      }

      if (progress.ready >= progress.total) {
        const scope =
          prefs.frequency === "daily" ? states : states.filter((state) => state.batchId === batchId);
        await sendEmails([
          build(
            client.email,
            templates.clientBatchAllReady({
              firstName: client.firstName,
              total: progress.total,
              waiting: waitingLinks(scope),
              ordersUrl: urls.clientOrders(),
              settingsUrl,
            }),
          ),
        ]);
        await saveClientEmailState(client.id, {
          lastSummaryAt: new Date().toISOString(),
          announced: [],
        });
        return;
      }

      // Somewhere in the middle of the batch: the daily summary covers it.
      return;
    }
  }

  // Clients on "one daily summary" hear about single orders in the summary.
  if (prefs.frequency === "daily") return;

  const input = {
    firstName: client.firstName,
    orderTitle: title,
    orderUrl: urls.clientOrder(orderId),
    settingsUrl,
  };
  await sendEmails([
    build(
      client.email,
      revised ? templates.clientRevisedDraftReady(input) : templates.clientDraftReady(input),
    ),
  ]);
}

/** An editor sent a draft back to its writer. */
export async function notifyEditorSentBack(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const writer = await getPerson(str(order.writer_id));
  if (!writer) return;

  await bell([writer], {
    title: `Editor sent back: ${str(order.title) || "your order"}`,
    body: formatDate(order.writer_due_at) ? `Resubmit by ${formatDate(order.writer_due_at)}.` : "It needs some changes.",
    href: pathOf(urls.writerOrder(orderId)),
    kind: "sent_back",
  });

  await sendEmails([
    build(
      writer.email,
      templates.writerSentBackByEditor({
        firstName: writer.firstName,
        orderTitle: str(order.title) || "your order",
        orderUrl: urls.writerOrder(orderId),
        fixByLabel: formatDate(order.writer_due_at),
      }),
    ),
  ]);
}

/** The client asked for changes. */
export async function notifyRevisionRequested(orderId: string, note: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;

  const [client, writer] = await Promise.all([
    getPerson(str(order.client_id)),
    getPerson(str(order.writer_id)),
  ]);
  const title = str(order.title) || "Untitled order";
  const emails: OutgoingEmail[] = [];

  // The client has responded: clear their "draft ready" for this order.
  if (client) await resolveInAppNotifications(client.id, pathOf(urls.clientOrder(orderId)));
  if (writer && writerWantsInApp(writer, "revision_requested")) {
    await bell([writer], {
      title: `Client asked for changes: ${title}`,
      body: clipText(redactContactDetails(note)) || "See the order for details.",
      href: pathOf(urls.writerOrder(orderId)),
      kind: "changes_requested",
    });
  }
  for (const member of await getTeamProfiles()) {
    await bell([member], {
      title: `Changes requested: ${title}`,
      body: client ? `${client.fullName} asked for changes.` : "",
      href: teamPath(member, "orders"),
      kind: "changes_requested_team",
    });
  }

  if (writer && writerWantsEmail(writer, "revision_requested")) {
    emails.push(
      build(
        writer.email,
        templates.writerRevisionRequested({
          firstName: writer.firstName,
          orderTitle: title,
          // Writers never see client contact details (same rule as the order page).
          note: redactContactDetails(note),
          orderUrl: urls.writerOrder(orderId),
          fixByLabel: formatDate(order.writer_due_at),
        }),
      ),
    );
  }

  // Account managers are told straight away only from the second round of
  // changes on the same order (a quality signal). First rounds go in the summary.
  const supabase = createServerSupabaseClient();
  const { count: rounds } = supabase
    ? await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId)
        .eq("status", "revision_requested")
    : { count: 0 };

  if (client && (rounds ?? 0) >= 2) {
    for (const member of await getOrderTeam()) {
      emails.push(
        build(
          member.email,
          templates.teamRevisionRequested({
            clientName: client.fullName,
            clientCompany: client.company,
            orderTitle: title,
            note,
            writerName: writer?.fullName ?? "",
            ordersUrl: urls.teamOrders(member.role),
          }),
        ),
      );
    }
  }

  await sendEmails(emails);
}

/** The client approved a draft. */
export async function notifyOrderApproved(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;

  const [client, writer] = await Promise.all([
    getPerson(str(order.client_id)),
    getPerson(str(order.writer_id)),
  ]);
  const title = str(order.title) || "Untitled order";
  const emails: OutgoingEmail[] = [];

  if (client) await resolveInAppNotifications(client.id, pathOf(urls.clientOrder(orderId)));
  if (writer && writerWantsInApp(writer, "submission_approved")) {
    await bell([writer], {
      title: `Approved: ${title}`,
      body: "Your earnings have been updated.",
      href: pathOf(urls.writerEarnings()),
      kind: "approved",
    });
  }

  if (writer && writerWantsEmail(writer, "submission_approved")) {
    emails.push(
      build(
        writer.email,
        templates.writerOrderApproved({
          firstName: writer.firstName,
          orderTitle: title,
          earningsUrl: urls.writerEarnings(),
        }),
      ),
    );
  }

  if (client) {
    const prefs = readClientEmailPrefs(client.notificationPrefs);
    const batchId = batchIdOf(order);
    const settingsUrl = urls.clientSettings();
    const states = batchId ? await getClientDraftStates(client.id) : [];
    const batch = states.filter((state) => state.batchId === batchId);

    if (prefs.enabled && batchId && batch.length > 1) {
      // Bulk: no email per approval. One closing email when nothing is left open.
      const open = batch.filter((state) => !["accepted", "cancelled"].includes(state.status));
      if (!open.length) {
        emails.push(
          build(
            client.email,
            templates.clientBatchComplete({
              firstName: client.firstName,
              approved: batch.filter((state) => state.status === "accepted").length,
              total: batch.length,
              ordersUrl: urls.clientOrders(),
              newOrderUrl: urls.clientNewOrder(),
              settingsUrl,
            }),
          ),
        );
      }
    }
    // Single orders: no email to the client. They just approved it themselves.
  }

  await sendEmails(emails);
}

/**
 * An account manager accepted a brief, so the clock has started. Single
 * orders: tell the client the due time. Bulk orders: one email per batch.
 */
export async function notifyBriefAccepted(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const client = await getPerson(str(order.client_id));
  if (!client) return;

  if (!batchIdOf(order)) {
    await bell([client], {
      title: `Brief accepted: ${str(order.title) || "your order"}`,
      body: formatDate(order.client_due_at) ? `Your draft is due by ${formatDate(order.client_due_at)}.` : "A writer can start now.",
      href: pathOf(urls.clientOrder(orderId)),
      kind: "brief_accepted",
    });
  }

  const prefs = readClientEmailPrefs(client.notificationPrefs);
  if (!prefs.enabled) return;

  const batchId = batchIdOf(order);
  if (batchId) {
    const supabase = createServerSupabaseClient();
    const { data } = supabase
      ? await supabase.from("orders").select("id, intake_details").eq("client_id", client.id).limit(500)
      : { data: [] };
    const total = ((data ?? []) as Row[]).filter((row) => batchIdOf(row) === batchId).length;
    if (total > 1) {
      if (!(await claimNotificationKey(`batch_accepted:${batchId}`))) return;
      await sendEmails([
        build(
          client.email,
          templates.clientBatchAccepted({
            firstName: client.firstName,
            total,
            ordersUrl: urls.clientOrders(),
            settingsUrl: urls.clientSettings(),
          }),
        ),
      ]);
      return;
    }
  }

  await sendEmails([
    build(
      client.email,
      templates.clientBriefAccepted({
        firstName: client.firstName,
        orderTitle: str(order.title) || "your order",
        dueLabel: formatDate(order.client_due_at),
        orderUrl: urls.clientOrder(orderId),
        settingsUrl: urls.clientSettings(),
      }),
    ),
  ]);
}

/** An account manager or admin assigned a writer. Always sent. */
export async function notifyWriterAssigned(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const writer = await getPerson(str(order.writer_id));
  if (!writer) return;

  await bell([writer], {
    title: `You've been assigned: ${str(order.title) || "an order"}`,
    body: formatDate(order.writer_due_at) ? `Your deadline is ${formatDate(order.writer_due_at)}.` : "Read the brief before you start.",
    href: pathOf(urls.writerOrder(orderId)),
    kind: "assigned",
  });
  const contentTypes = await getContentTypeNames([str(order.content_type_id)]);
  await sendEmails([
    build(
      writer.email,
      templates.writerAssigned({
        firstName: writer.firstName,
        order: summarise(order, contentTypes, "writer"),
      }),
    ),
  ]);
}

/** An account manager or admin assigned an editor. Always sent. */
export async function notifyEditorAssigned(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const editor = await getPerson(str(order.editor_id));
  if (!editor) return;

  await bell([editor], {
    title: `You're editing: ${str(order.title) || "an order"}`,
    body: formatDate(order.client_due_at) ? `Due to the client by ${formatDate(order.client_due_at)}.` : "",
    href: pathOf(urls.editorHome()),
    kind: "assigned",
  });
  const stage = resolveWorkflowStatus({
    dbStatus: str(order.status),
    workflowStatus: str(order.workflow_status) || null,
  });
  await sendEmails([
    build(
      editor.email,
      templates.editorAssigned({
        firstName: editor.firstName,
        orderTitle: str(order.title) || "Untitled order",
        clientDueLabel: formatDate(order.client_due_at),
        draftWaiting: stage === "with_editor",
        queueUrl: urls.editorHome(),
      }),
    ),
  ]);
}

/** An admin cancelled an order. Always sent: it concerns the client's money. */
export async function notifyOrderCancelled(orderId: string) {
  const order = await getOrderRow(orderId);
  if (!order) return;
  const client = await getPerson(str(order.client_id));
  if (!client) return;

  const cancelledTitle = str(order.title) || "Untitled order";
  await bell([client], {
    title: `Order cancelled: ${cancelledTitle}`,
    body:
      Number(order.budget_cents ?? 0) > 0
        ? `${formatUsdFromCents(Number(order.budget_cents))} will be returned to your content budget.`
        : "",
    href: pathOf(urls.clientOrder(orderId)),
    kind: "cancelled",
  });
  const cancelledWriter = await getPerson(str(order.writer_id));
  if (cancelledWriter) {
    await resolveInAppNotifications(cancelledWriter.id, pathOf(urls.writerOrder(orderId)));
    await bell([cancelledWriter], {
      title: `Order cancelled: ${cancelledTitle}`,
      body: "You don't need to do any more work on it.",
      href: pathOf(urls.writerHome()),
      kind: "cancelled",
    });
  }

  const cents = Number(order.budget_cents ?? 0);
  await sendEmails([
    build(
      client.email,
      templates.clientOrderCancelled({
        firstName: client.firstName,
        orderTitle: str(order.title) || "Untitled order",
        amountLabel: cents > 0 ? formatUsdFromCents(cents) : "",
        budgetUrl: urls.clientBudget(),
      }),
    ),
  ]);
}

/** Someone commented on a draft: tell the writer, unless they wrote it. */
export async function notifyComment(submissionId: string, authorId: string, body: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !body.trim()) return;

  const { data } = await supabase
    .from("submissions")
    .select("order_id, writer_id")
    .eq("id", submissionId)
    .maybeSingle();
  const submission = data as Row | null;
  if (!submission || str(submission.writer_id) === authorId) return;

  const [writer, author, order] = await Promise.all([
    getPerson(str(submission.writer_id)),
    getPerson(authorId),
    getOrderRow(str(submission.order_id)),
  ]);
  if (!writer || !order) return;

  await bell([writer], {
    title: `New comment on ${str(order.title) || "your order"}`,
    body: clipText(redactContactDetails(body)),
    href: pathOf(urls.writerOrder(str(order.id))),
    kind: "comment",
  });

  await sendEmails([
    build(
      writer.email,
      templates.writerNewComment({
        firstName: writer.firstName,
        commenterName: author?.role === "client" ? "The client" : author?.fullName ?? "Someone",
        orderTitle: str(order.title) || "your order",
        comment: redactContactDetails(body),
        orderUrl: urls.writerOrder(str(order.id)),
      }),
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/** A Stripe top-up was credited. Always sent to the client. */
export async function notifyTopUp(clientProfileId: string, amountCents: number, bonusCents: number) {
  const supabase = createServerSupabaseClient();
  const client = await getPerson(clientProfileId);
  if (!supabase || !client) return;

  const { data } = await supabase
    .from("client_wallets")
    .select("available_cents")
    .eq("client_id", clientProfileId)
    .maybeSingle();
  const balanceCents = Number((data as Row | null)?.available_cents ?? 0);
  const balanceLabel = balanceCents > 0 ? formatUsdFromCents(balanceCents) : "";
  const amountLabel = formatUsdFromCents(amountCents);

  // Admin sees top-ups (and payout requests) in the morning summary.
  await sendEmails([
    build(
      client.email,
      templates.clientTopUpReceived({
        firstName: client.firstName,
        amountLabel,
        bonusLabel: bonusCents > 0 ? formatUsdFromCents(bonusCents) : "",
        balanceLabel,
        budgetUrl: urls.clientBudget(),
      }),
    ),
  ]);
}

/** A writer asked for a payout: admins see it in the bell (and in the morning summary email). */
export async function notifyPayoutRequested(writerId: string, amountCents: number) {
  const writer = await getPerson(writerId);
  if (!writer) return;
  await bell(await getPeopleByRole(["admin"]), {
    title: `Payout requested: ${writer.fullName}`,
    body: formatUsdFromCents(amountCents),
    href: pathOf(urls.adminPayouts()),
    kind: "payout_requested",
  });
}

/** An admin approved a payout: tell the writer. */
export async function notifyPayoutApproved(writerId: string, amountCents: number) {
  const writer = await getPerson(writerId);
  if (writer && writerWantsInApp(writer, "payout_update")) {
    await bell([writer], {
      title: `Payout approved: ${formatUsdFromCents(amountCents)}`,
      body: "",
      href: pathOf(urls.writerEarnings()),
      kind: "payout",
    });
  }
  if (!writer || !writerWantsEmail(writer, "payout_update")) return;

  await sendEmails([
    build(
      writer.email,
      templates.writerPayoutApproved({
        firstName: writer.firstName,
        amountLabel: formatUsdFromCents(amountCents),
        earningsUrl: urls.writerEarnings(),
      }),
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/* Daily summary (called by /api/cron/daily-summary)                   */
/* ------------------------------------------------------------------ */

/**
 * One email per client listing the drafts waiting for review.
 * - Clients on "one daily summary": all their orders.
 * - Everyone else: bulk orders only (single orders are emailed as they happen).
 * Skipped when nothing new has arrived since the last summary.
 */
export async function sendDailySummaries() {
  const supabase = createServerSupabaseClient();
  if (!supabase || !emailConfigured()) return { clients: 0, sent: 0 };

  // Only clients with a draft currently waiting are worth looking at.
  const { data: pending } = await supabase
    .from("submissions")
    .select("order_id")
    .in("status", ["submitted", "resubmitted"])
    .order("submitted_at", { ascending: false })
    .limit(1000);
  const orderIds = [...new Set(((pending ?? []) as Row[]).map((row) => str(row.order_id)))];
  if (!orderIds.length) return { clients: 0, sent: 0 };

  const { data: orders } = await supabase.from("orders").select("client_id").in("id", orderIds);
  const clientIds = [...new Set(((orders ?? []) as Row[]).map((row) => str(row.client_id)))];

  let sent = 0;

  for (const clientId of clientIds) {
    const client = await getPerson(clientId);
    if (!client) continue;

    const prefs = readClientEmailPrefs(client.notificationPrefs);
    if (!prefs.enabled) continue;

    const states = await getClientDraftStates(clientId);
    const batchSizes = new Map<string, number>();
    for (const state of states) {
      if (state.batchId) batchSizes.set(state.batchId, (batchSizes.get(state.batchId) ?? 0) + 1);
    }
    const isBulk = (state: DraftState) => (batchSizes.get(state.batchId) ?? 0) > 1;
    const scope = prefs.frequency === "daily" ? states : states.filter(isBulk);

    // No summary sent yet: count anything from the last two weeks as new, so a
    // draft that arrived just after yesterday's run is never skipped.
    const since =
      prefs.lastSummaryAt ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const alreadyAnnounced = new Set(announcedIds(client));
    const waiting = scope.filter((state) => state.waiting);
    const sinceTime = new Date(since).getTime();
    const fresh = waiting.filter(
      (state) =>
        new Date(state.latestSubmittedAt).getTime() > sinceTime &&
        !alreadyAnnounced.has(state.orderId),
    );
    if (!fresh.length) continue;

    const batchIds = [...new Set(waiting.filter(isBulk).map((state) => state.batchId))];
    const result = await sendEmails([
      build(
        client.email,
        templates.clientDailySummary({
          firstName: client.firstName,
          waiting: waitingLinks(waiting),
          newCount: fresh.length,
          batches: batchIds.map((batchId) => batchProgress(states, batchId)),
          ordersUrl: urls.clientOrders(),
          settingsUrl: urls.clientSettings(),
        }),
      ),
    ]);

    if (result.sent > 0) {
      sent += result.sent;
      await saveClientEmailState(clientId, {
        lastSummaryAt: new Date().toISOString(),
        announced: [],
      });
    }
  }

  return { clients: clientIds.length, sent };
}
