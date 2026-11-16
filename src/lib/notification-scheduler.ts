/**
 * Timed emails: deadline reminders, alerts and the 08:00 UK summaries.
 *
 * `runNotificationTick` is called every 15 minutes by /api/cron/tick. Each
 * email has a key in `notification_log`, so it is sent once even though the
 * check repeats. Keys include the deadline they refer to, so a new deadline
 * (for example after a change request) gets fresh reminders.
 *
 * Timings (decided 16 Nov 2026):
 * - Writer: reminder 12 hours before their deadline (8 for rush), a final
 *   nudge 2 hours before, and an overdue alert (also to account managers).
 * - Account managers: brief unchecked 4 hours after the order (1 for rush);
 *   no writer 6 hours after acceptance (2 for rush); at risk 12 hours before
 *   the client deadline (6 for rush) with nothing delivered; client deadline
 *   missed (also to admin).
 * - Editors: a draft waiting 2 hours in the editing queue; at 4 hours
 *   account managers are told too.
 * - From 08:00 UK each day: account manager summary, admin summary and the
 *   client daily summaries.
 */

import { emailConfigured, sendEmails, type OutgoingEmail } from "@/lib/email";
import * as templates from "@/lib/email-templates";
import type { EmailLink, SummarySection } from "@/lib/email-templates";
import {
  build,
  claimNotificationKey,
  formatDate,
  getAdminRecipients,
  getOrderTeam,
  getPeopleWithRole,
  getPerson,
  sendDailySummaries,
  urls,
  writerWantsEmail,
  type Person,
} from "@/lib/notifications";
import { deliveryHoursFor, resolveWorkflowStatus, type WorkflowStatus } from "@/lib/order-workflow";
import { formatUsdFromCents } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const HOUR = 60 * 60 * 1000;

/** Stages where a writer owes work. */
const WRITER_OWES: WorkflowStatus[] = ["being_written", "changes_requested", "sent_back_by_editor"];
/** Stages where the client has had at least one draft. */
const DELIVERED: WorkflowStatus[] = ["in_review", "waiting_for_approval", "completed", "changes_requested"];

function str(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function isRush(order: Row) {
  return str(order.priority) === "rush";
}

function timeOf(value: unknown) {
  const ms = new Date(str(value)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function stageOf(order: Row): WorkflowStatus {
  return resolveWorkflowStatus({
    dbStatus: str(order.status),
    workflowStatus: str(order.workflow_status) || null,
  });
}

function teamOrderUrl(member: Person, orderId: string) {
  return member.role === "admin" ? `${urls.teamOrders("admin")}/${orderId}` : urls.teamOrders(member.role);
}

function londonParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    label: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(now),
  };
}

export type TickResult = { checked: number; sent: number; skipped: string[] };

export async function runNotificationTick(now: Date = new Date()): Promise<TickResult> {
  const result: TickResult = { checked: 0, sent: 0, skipped: [] };
  const supabase = createServerSupabaseClient();
  if (!supabase || !emailConfigured()) {
    result.skipped.push("email or database not configured");
    return result;
  }

  // Is the log table there? Without it reminders would repeat every 15 minutes.
  const probe = await supabase.from("notification_log").select("key").limit(1);
  if (probe.error) {
    result.skipped.push(`notification_log unavailable: ${probe.error.message}`);
    return result;
  }

  const { data: orderData } = await supabase
    .from("orders")
    .select(
      "id, title, client_id, writer_id, editor_id, status, workflow_status, priority, created_at, updated_at, client_due_at, writer_due_at, intake_details",
    )
    .not("status", "in", "(accepted,cancelled)")
    .order("created_at", { ascending: true })
    .limit(1000);
  const orders = (orderData ?? []) as Row[];
  result.checked = orders.length;

  // Latest submission per order (for the editing queue).
  const latest = new Map<string, Row>();
  if (orders.length) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("id, order_id, version, submitted_at")
      .in(
        "order_id",
        orders.map((order) => str(order.id)),
      );
    for (const sub of (subs ?? []) as Row[]) {
      const key = str(sub.order_id);
      const current = latest.get(key);
      if (!current || Number(sub.version ?? 0) > Number(current.version ?? 0)) latest.set(key, sub);
    }
  }

  let team: Person[] | null = null;
  const getTeam = async () => (team ??= await getOrderTeam());
  let admins: Person[] | null = null;
  const getAdmins = async () => (admins ??= await getAdminRecipients());
  let editors: Person[] | null = null;
  const getEditors = async () => (editors ??= await getPeopleWithRole("editor"));

  const outbox: OutgoingEmail[] = [];

  async function once(key: string, make: () => Promise<OutgoingEmail[]>) {
    const emails = await make();
    if (!emails.length) return;
    if (!(await claimNotificationKey(key))) return;
    outbox.push(...emails);
  }

  async function alertTeam(key: string, subject: string, lead: string, order: Row, details: string[], alsoAdmin = false) {
    await once(key, async () => {
      const people = [...(await getTeam()), ...(alsoAdmin ? await getAdmins() : [])];
      const seen = new Set<string>();
      return people
        .filter((person) => {
          const email = person.email.toLowerCase();
          if (seen.has(email)) return false;
          seen.add(email);
          return true;
        })
        .map((person) =>
          build(
            person.email,
            templates.teamAlert({
              subject,
              lead,
              details,
              button: { label: "Open the order", url: teamOrderUrl(person, str(order.id)) },
            }),
          ),
        );
    });
  }

  for (const order of orders) {
    const id = str(order.id);
    const title = str(order.title) || "Untitled order";
    const stage = stageOf(order);
    const rush = isRush(order);
    const nowMs = now.getTime();
    const clientDue = timeOf(order.client_due_at);
    const writerDue = timeOf(order.writer_due_at);
    const created = timeOf(order.created_at);
    const clientDueLabel = formatDate(order.client_due_at);
    const details = [clientDueLabel ? `Due to the client: ${clientDueLabel}` : "", rush ? "Rush delivery" : ""].filter(
      Boolean,
    );

    // Brief not checked yet.
    if (stage === "brief_check" && created && nowMs - created >= (rush ? 1 : 4) * HOUR) {
      await alertTeam(
        `brief_unchecked:${id}`,
        `Brief waiting ${rush ? "1 hour" : "4 hours"}: ${title}`,
        `"${title}" was ordered ${rush ? "an hour" : "4 hours"} ago and its brief hasn't been checked. The delivery clock only starts once it's accepted.`,
        order,
        rush ? ["Rush delivery"] : [],
      );
    }

    // Accepted but no writer has claimed it.
    if (stage === "waiting_for_writer" && !str(order.writer_id) && clientDue) {
      const acceptedAt = clientDue - deliveryHoursFor(str(order.priority)) * HOUR;
      if (nowMs - acceptedAt >= (rush ? 2 : 6) * HOUR) {
        await alertTeam(
          `unclaimed:${id}:${str(order.client_due_at)}`,
          `No writer yet: ${title}`,
          `"${title}" was accepted ${rush ? "2" : "6"} hours ago and no writer has claimed it.`,
          order,
          details,
        );
      }
    }

    // Writer deadline: reminders and overdue.
    if (str(order.writer_id) && writerDue && WRITER_OWES.includes(stage)) {
      const left = writerDue - nowMs;
      const dueLabel = formatDate(order.writer_due_at);
      const isRevision = stage !== "being_written";
      const due = str(order.writer_due_at);
      const writer = await getPerson(str(order.writer_id));

      if (writer && left > 2 * HOUR && left <= (rush ? 8 : 12) * HOUR && stage !== "sent_back_by_editor") {
        await once(`writer_first:${id}:${due}`, async () =>
          writerWantsEmail(writer, "deadline_reminder")
            ? [
                build(
                  writer.email,
                  templates.writerDeadlineReminder({
                    firstName: writer.firstName,
                    orderTitle: title,
                    dueLabel,
                    hoursLeft: Math.round(left / HOUR),
                    isRevision,
                    orderUrl: urls.writerOrder(id),
                  }),
                ),
              ]
            : [],
        );
      }

      if (writer && left > 0 && left <= 2 * HOUR) {
        await once(`writer_final:${id}:${due}`, async () => [
          build(
            writer.email,
            templates.writerDeadlineReminder({
              firstName: writer.firstName,
              orderTitle: title,
              dueLabel,
              hoursLeft: Math.max(1, Math.round(left / HOUR)),
              isRevision,
              orderUrl: urls.writerOrder(id),
            }),
          ),
        ]);
      }

      if (left <= 0) {
        if (writer) {
          await once(`writer_overdue:${id}:${due}`, async () => [
            build(
              writer.email,
              templates.writerOverdue({
                firstName: writer.firstName,
                orderTitle: title,
                dueLabel,
                orderUrl: urls.writerOrder(id),
              }),
            ),
          ]);
        }
        await alertTeam(
          `writer_missed:${id}:${due}`,
          `Writer missed their deadline: ${title}`,
          `${writer?.fullName ?? "The writer"} hasn't submitted "${title}", which was due by ${dueLabel}.`,
          order,
          details,
        );
      }
    }

    // Client deadline: at risk, then missed. Only before the first delivery,
    // and not while we're waiting on the client.
    if (clientDue && !DELIVERED.includes(stage) && stage !== "waiting_on_client") {
      const left = clientDue - nowMs;
      // A draft already with the editor is on track; the editor reminders cover it.
      if (left > 0 && left <= (rush ? 6 : 12) * HOUR && stage !== "with_editor") {
        await alertTeam(
          `at_risk:${id}:${str(order.client_due_at)}`,
          `At risk: ${title}`,
          `"${title}" is due to the client by ${clientDueLabel} and nothing has been delivered yet. If it may be late, tell the client now and give them a new delivery time (client terms 6.4).`,
          order,
          details,
        );
      }
      if (left <= 0) {
        await alertTeam(
          `client_missed:${id}:${str(order.client_due_at)}`,
          `Client deadline missed: ${title}`,
          `"${title}" was due to the client by ${clientDueLabel} and hasn't been delivered. A 25% credit is owed if it's late for a reason within our control (client terms 6.4).`,
          order,
          details,
          true,
        );
      }
    }

    // Draft waiting in the editing queue.
    if (stage === "with_editor") {
      const sub = latest.get(id);
      const since = timeOf(sub?.submitted_at);
      if (sub && since) {
        const waited = nowMs - since;
        if (waited >= 2 * HOUR) {
          await once(`editor_waiting:${id}:${str(sub.id)}`, async () =>
            (str(order.editor_id)
              ? [await getPerson(str(order.editor_id))].filter((p): p is Person => Boolean(p))
              : await getEditors()
            ).map((editor) =>
              build(
                editor.email,
                templates.editorDraftWaiting({
                  firstName: editor.firstName,
                  orderTitle: title,
                  waitingHours: 2,
                  clientDueLabel,
                  queueUrl: urls.editorHome(),
                }),
              ),
            ),
          );
        }
        if (waited >= 4 * HOUR) {
          await alertTeam(
            `editor_waiting_team:${id}:${str(sub.id)}`,
            `Draft waiting 4 hours for an editor: ${title}`,
            `"${title}" has been in the editing queue for 4 hours. The editing window is closing.`,
            order,
            details,
          );
        }
      }
    }
  }

  // Morning summaries, from 08:00 UK.
  const london = londonParts(now);
  if (london.hour >= 8) {
    if (await claimNotificationKey(`summary_team:${london.dateKey}`)) {
      outbox.push(...(await buildTeamSummary(orders, now, london.label)));
    }
    if (await claimNotificationKey(`summary_admin:${london.dateKey}`)) {
      outbox.push(...(await buildAdminSummary(orders, now, london.label)));
    }
    if (await claimNotificationKey(`summary_writers:${london.dateKey}`)) {
      outbox.push(...(await buildWriterDigests(now)));
    }
    if (await claimNotificationKey(`summary_clients:${london.dateKey}`)) {
      const clients = await sendDailySummaries();
      result.sent += clients.sent;
    }
  }

  if (outbox.length) {
    const sent = await sendEmails(outbox);
    result.sent += sent.sent;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

async function buildTeamSummary(orders: Row[], now: Date, dateLabel: string): Promise<OutgoingEmail[]> {
  const supabase = createServerSupabaseClient();
  const team = await getOrderTeam();
  if (!supabase || !team.length) return [];

  const nowMs = now.getTime();
  const dueSoon: Row[] = [];
  const overdueWriters: Row[] = [];
  const unclaimed: Row[] = [];
  const briefs: Row[] = [];
  const waitingOnClient: Row[] = [];
  const revisions: Row[] = [];

  for (const order of orders) {
    const stage = stageOf(order);
    const clientDue = timeOf(order.client_due_at);
    const writerDue = timeOf(order.writer_due_at);
    if (clientDue && !DELIVERED.includes(stage) && clientDue - nowMs <= 24 * HOUR) dueSoon.push(order);
    if (writerDue && str(order.writer_id) && WRITER_OWES.includes(stage) && writerDue <= nowMs) overdueWriters.push(order);
    if (stage === "waiting_for_writer" && !str(order.writer_id)) unclaimed.push(order);
    if (stage === "brief_check") briefs.push(order);
    if (stage === "waiting_on_client") waitingOnClient.push(order);
    if (stage === "changes_requested") revisions.push(order);
  }

  const { data: newClients } = await supabase
    .from("profiles")
    .select("full_name, company_name, email")
    .eq("role", "client")
    .gte("created_at", new Date(nowMs - 24 * HOUR).toISOString())
    .limit(50);

  return team.map((member) => {
    const ordersUrl = urls.teamOrders(member.role);
    const label = (order: Row, extra: string): EmailLink => ({
      label: `${str(order.title) || "Untitled order"}${extra ? ` (${extra})` : ""}`,
      url: teamOrderUrl(member, str(order.id)),
    });
    const sections: SummarySection[] = [
      {
        heading: "Due to clients in the next 24 hours, not delivered yet",
        items: dueSoon.map((order) => label(order, formatDate(order.client_due_at))),
      },
      {
        heading: "Writers past their deadline",
        items: overdueWriters.map((order) => label(order, `writer due ${formatDate(order.writer_due_at)}`)),
      },
      { heading: "Accepted, no writer yet", items: unclaimed.map((order) => label(order, "")) },
      { heading: "Briefs to check", items: briefs.map((order) => label(order, "")) },
      { heading: "Waiting on a client answer", items: waitingOnClient.map((order) => label(order, "")) },
      {
        heading: "Changes in progress",
        items: revisions.map((order) => label(order, `fix by ${formatDate(order.writer_due_at)}`)),
      },
      {
        heading: "New clients in the last 24 hours",
        items: ((newClients ?? []) as Row[]).map((client) => ({
          label: [str(client.full_name), str(client.company_name), str(client.email)].filter(Boolean).join(", "),
          url: urls.teamClients(member.role),
        })),
      },
    ];
    return build(
      member.email,
      templates.teamMorningSummary({
        audience: "account managers",
        dateLabel,
        sections,
        button: { label: "Open orders", url: ordersUrl },
      }),
    );
  });
}

async function buildAdminSummary(orders: Row[], now: Date, dateLabel: string): Promise<OutgoingEmail[]> {
  const supabase = createServerSupabaseClient();
  const admins = await getAdminRecipients();
  if (!supabase || !admins.length) return [];

  const since = new Date(now.getTime() - 24 * HOUR).toISOString();
  const nowMs = now.getTime();

  const [{ data: newClients }, { data: topUps }, { data: payouts }] = await Promise.all([
    supabase.from("profiles").select("full_name, company_name, email").eq("role", "client").gte("created_at", since).limit(50),
    supabase.from("wallet_ledger").select("client_id, amount_cents, kind, created_at").eq("kind", "top_up").gte("created_at", since).limit(100),
    supabase.from("payout_requests").select("writer_id, amount_cents, status, requested_at").eq("status", "pending").limit(100),
  ]);

  const late = orders.filter((order) => {
    const due = timeOf(order.client_due_at);
    return due && due <= nowMs && !DELIVERED.includes(stageOf(order));
  });

  const topUpItems: EmailLink[] = [];
  for (const row of (topUps ?? []) as Row[]) {
    const client = await getPerson(str(row.client_id));
    topUpItems.push({
      label: `${client?.company || client?.fullName || "A client"}: ${formatUsdFromCents(Number(row.amount_cents ?? 0))}`,
      url: urls.teamClients("admin"),
    });
  }

  const payoutItems: EmailLink[] = [];
  for (const row of (payouts ?? []) as Row[]) {
    const writer = await getPerson(str(row.writer_id));
    payoutItems.push({
      label: `${writer?.fullName ?? "A writer"}: ${formatUsdFromCents(Number(row.amount_cents ?? 0))}`,
      url: urls.adminPayouts(),
    });
  }

  const sections: SummarySection[] = [
    {
      heading: "Late to clients (credit may be owed)",
      items: late.map((order) => ({
        label: `${str(order.title) || "Untitled order"} (due ${formatDate(order.client_due_at)})`,
        url: `${urls.teamOrders("admin")}/${str(order.id)}`,
      })),
    },
    { heading: "Payout requests waiting", items: payoutItems },
    { heading: "Top-ups in the last 24 hours", items: topUpItems },
    {
      heading: "New clients in the last 24 hours",
      items: ((newClients ?? []) as Row[]).map((client) => ({
        label: [str(client.full_name), str(client.company_name), str(client.email)].filter(Boolean).join(", "),
        url: urls.teamClients("admin"),
      })),
    },
  ];

  return admins.map((admin) =>
    build(
      admin.email,
      templates.teamMorningSummary({
        audience: "admin",
        dateLabel,
        sections,
        button: { label: "Open admin", url: urls.teamOrders("admin") },
      }),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Writer daily digest                                                 */
/* ------------------------------------------------------------------ */

/**
 * Signature and Specialist writers get one email a day listing the Signature
 * and Specialist jobs that reached the marketplace in the last 24 hours and are
 * still unclaimed. No new jobs for a writer: no email.
 * - Signature writers: Signature jobs.
 * - Specialist writers (writer_tier "specialist", or the "specialist" niche tag
 *   the marketplace also uses): Signature and Specialist jobs.
 * Follows the writer's "new matching jobs" email setting.
 */
async function buildWriterDigests(now: Date): Promise<OutgoingEmail[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data: jobData } = await supabase
    .from("orders")
    .select("id, title, service_tier, word_count, language, created_at, reserved_by, reserved_until, content_types(name)")
    .eq("status", "open")
    .is("writer_id", null)
    .in("service_tier", ["signature", "rank"])
    .order("created_at", { ascending: false })
    .limit(200);
  const jobs = (jobData ?? []) as Row[];
  if (!jobs.length) return [];

  const since = now.getTime() - 24 * HOUR;
  const isNew = (job: Row) => (timeOf(job.created_at) ?? 0) >= since;
  if (!jobs.some(isNew)) return [];

  const { data: writerData } = await supabase
    .from("profiles")
    .select("id, writer_tier, niche_tags, approval_status")
    .eq("role", "writer")
    .limit(500);

  const describe = (job: Row) => {
    const type = (job.content_types as { name?: string } | null)?.name ?? "";
    const tier = str(job.service_tier) === "rank" ? "Specialist" : "Signature";
    const words = Number(job.word_count ?? 0);
    return [
      str(job.title) || "Untitled",
      tier,
      type,
      words ? `${words.toLocaleString("en-GB")} words` : "",
      str(job.language),
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const emails: OutgoingEmail[] = [];
  for (const row of (writerData ?? []) as Row[]) {
    if (["pending", "paused"].includes(str(row.approval_status ?? "approved").toLowerCase())) continue;
    const tags = Array.isArray(row.niche_tags) ? row.niche_tags.map((tag) => str(tag).toLowerCase()) : [];
    const specialist = str(row.writer_tier) === "specialist" || tags.includes("specialist");
    const signature = str(row.writer_tier) === "signature";
    if (!specialist && !signature) continue;

    const eligible = jobs.filter((job) => specialist || str(job.service_tier) === "signature");
    const fresh = eligible.filter(isNew);
    if (!fresh.length) continue;

    const writer = await getPerson(str(row.id));
    if (!writer || !writerWantsEmail(writer, "new_matching_job")) continue;

    emails.push(
      build(
        writer.email,
        templates.writerDailyDigest({
          firstName: writer.firstName,
          tierLabel: specialist ? "Signature and Specialist" : "Signature",
          jobs: fresh.slice(0, 25).map(describe),
          otherOpen: eligible.length - fresh.length,
          marketplaceUrl: urls.writerMarketplace(),
        }),
      ),
    );
  }
  return emails;
}
