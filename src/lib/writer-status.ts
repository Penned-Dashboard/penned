// Pure helpers for the Writer dashboard. No server-only imports so they are safe anywhere.

export const ASSUMED_WORDS_PER_HOUR = 400;

export type WriterStatusKey =
  | "open"
  | "not_started"
  | "in_progress"
  | "in_review"
  | "revisions_requested"
  | "approved"
  | "paid"
  | "cancelled";

export type StatusTone = "slate" | "blue" | "amber" | "rose" | "emerald" | "violet";

export type WriterStatus = {
  key: WriterStatusKey;
  label: string;
  tone: StatusTone;
};

const STATUS_META: Record<WriterStatusKey, { label: string; tone: StatusTone }> = {
  open: { label: "Open", tone: "slate" },
  not_started: { label: "Not started", tone: "slate" },
  in_progress: { label: "In progress", tone: "blue" },
  in_review: { label: "In review", tone: "violet" },
  revisions_requested: { label: "Revisions requested", tone: "amber" },
  approved: { label: "Approved", tone: "emerald" },
  paid: { label: "Paid", tone: "emerald" },
  cancelled: { label: "Cancelled", tone: "rose" },
};

export const WRITER_STATUS_FILTERS: { key: WriterStatusKey; label: string }[] = [
  "not_started",
  "in_progress",
  "in_review",
  "revisions_requested",
  "approved",
  "paid",
].map((key) => ({ key: key as WriterStatusKey, label: STATUS_META[key as WriterStatusKey].label }));

/**
 * Maps the database order_status enum onto the P0 writer-facing statuses.
 * `started` comes from orders.intake_details.writer_started, `paid` from settled payouts.
 */
export function mapWriterStatus(
  dbStatus: string,
  options: { started?: boolean; paid?: boolean } = {},
): WriterStatus {
  const key = resolveStatusKey(dbStatus, options);
  return { key, ...STATUS_META[key] };
}

function resolveStatusKey(
  dbStatus: string,
  { started, paid }: { started?: boolean; paid?: boolean },
): WriterStatusKey {
  switch (dbStatus) {
    case "open":
    case "draft":
      return "open";
    case "claimed":
      return started ? "in_progress" : "not_started";
    case "submitted":
    case "in_review":
      return "in_review";
    case "revision_requested":
      return "revisions_requested";
    case "accepted":
      return paid ? "paid" : "approved";
    case "cancelled":
      return "cancelled";
    default:
      return "not_started";
  }
}

export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export type CountdownTone = "green" | "amber" | "red" | "none";

/**
 * orders.due_date is a plain `date`. A job is due at the END of that day (UTC).
 * Full ISO timestamps are passed through untouched.
 */
export function dueDateToDeadline(dueDate: string | null | undefined): Date | null {
  if (!dueDate) return null;
  const value = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? `${dueDate}T23:59:59.000Z` : dueDate;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hoursUntil(dueDate: string | null | undefined, now: Date = new Date()): number | null {
  const deadline = dueDateToDeadline(dueDate);
  if (!deadline) return null;
  return (deadline.getTime() - now.getTime()) / 3_600_000;
}

/** >48h green, 12-48h amber, <12h (including overdue) red. */
export function getCountdownTone(dueDate: string | null | undefined, now: Date = new Date()): CountdownTone {
  const hours = hoursUntil(dueDate, now);
  if (hours === null) return "none";
  if (hours > 48) return "green";
  if (hours >= 12) return "amber";
  return "red";
}

export function formatCountdown(dueDate: string | null | undefined, now: Date = new Date()): string {
  const hours = hoursUntil(dueDate, now);
  if (hours === null) return "No due date";

  const absolute = Math.abs(hours);
  const days = Math.floor(absolute / 24);
  const remainderHours = Math.floor(absolute % 24);
  const text =
    days > 0
      ? `${days}d ${remainderHours}h`
      : absolute >= 1
        ? `${Math.floor(absolute)}h`
        : `${Math.max(1, Math.floor(absolute * 60))}m`;

  return hours < 0 ? `Overdue by ${text}` : `${text} left`;
}

export const COUNTDOWN_TONE_CLASSES: Record<CountdownTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  none: "border-slate-200 bg-slate-50 text-slate-500",
};

/** Estimated pay per hour in cents, based on ASSUMED_WORDS_PER_HOUR. Null when it can't be computed. */
export function estimatePayPerHour(
  budgetCents: number | null | undefined,
  wordCount: number | null | undefined,
): number | null {
  if (!budgetCents || !wordCount || wordCount <= 0) return null;
  const hours = wordCount / ASSUMED_WORDS_PER_HOUR;
  return Math.round(budgetCents / hours);
}

export function formatUsd(cents: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100);
}

export function formatPayPerHour(cents: number | null): string {
  return cents === null ? "—" : `~${formatUsd(cents)}/hr`;
}

export function formatRelativeTime(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export type NotificationEvent = { key: string; label: string; description: string };

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: "new_matching_job", label: "New matching jobs", description: "A job matching your niches is posted." },
  { key: "revision_requested", label: "Revision requested", description: "A client asks for changes." },
  { key: "submission_approved", label: "Work approved", description: "A client approves your submission." },
  { key: "deadline_reminder", label: "Deadline reminders", description: "A job is due in less than 24 hours." },
  { key: "payout_update", label: "Payout updates", description: "A payout is approved or sent." },
  { key: "weekly_summary", label: "Weekly summary", description: "Your weekly earnings and ranking recap." },
];

export const NOTIFICATION_CHANNELS = [
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
] as const;

export type NotificationPrefs = Record<string, { email: boolean; inApp: boolean }>;

export function normalizeNotificationPrefs(raw: unknown): NotificationPrefs {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: NotificationPrefs = {};

  for (const event of NOTIFICATION_EVENTS) {
    const entry = source[event.key];
    const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    result[event.key] = {
      email: typeof record.email === "boolean" ? record.email : true,
      inApp: typeof record.inApp === "boolean" ? record.inApp : true,
    };
  }

  return result;
}
