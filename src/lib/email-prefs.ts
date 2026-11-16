/**
 * Client email preferences, stored inside profiles.notification_prefs (jsonb)
 * under the "client_email" key. A missing value means "on, as they happen",
 * so new and existing accounts are opted in by default.
 */

export type ClientEmailFrequency = "instant" | "daily";

export type ClientEmailPrefs = {
  /** Order updates by email. Account and payment emails are always sent. */
  enabled: boolean;
  frequency: ClientEmailFrequency;
  /** ISO time of the last daily summary (or "all drafts ready" email). */
  lastSummaryAt: string | null;
};

export const CLIENT_EMAIL_PREFS_KEY = "client_email";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function readClientEmailPrefs(notificationPrefs: unknown): ClientEmailPrefs {
  const entry = asRecord(asRecord(notificationPrefs)[CLIENT_EMAIL_PREFS_KEY]);
  return {
    enabled: typeof entry.enabled === "boolean" ? entry.enabled : true,
    frequency: entry.frequency === "daily" ? "daily" : "instant",
    lastSummaryAt: typeof entry.lastSummaryAt === "string" ? entry.lastSummaryAt : null,
  };
}

/** Returns the full notification_prefs object with the client entry replaced. */
export function writeClientEmailPrefs(
  notificationPrefs: unknown,
  next: Partial<ClientEmailPrefs>,
): Record<string, unknown> {
  const current = readClientEmailPrefs(notificationPrefs);
  // Keep any other fields stored in the entry (for example "announced").
  const existing = asRecord(asRecord(notificationPrefs)[CLIENT_EMAIL_PREFS_KEY]);
  return {
    ...asRecord(notificationPrefs),
    [CLIENT_EMAIL_PREFS_KEY]: { ...existing, ...current, ...next },
  };
}
