/**
 * Email sending through Resend (https://resend.com), over plain fetch.
 *
 * Environment variables:
 * - RESEND_API_KEY   required. Without it nothing is sent.
 * - EMAIL_FROM       required, e.g. "Penned <notifications@mail.penned.io>".
 * - EMAIL_REPLY_TO   optional reply-to address.
 * - EMAIL_ALLOWLIST  optional comma-separated addresses. While EMAIL_MODE is not
 *                    "live", only these addresses receive email.
 * - EMAIL_MODE       "live" sends to everyone. Anything else sends to the allow-list only.
 *
 * Sending never throws: a failed email must not break the action that caused it.
 */

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const RESEND_BATCH_LIMIT = 100;

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function allowList() {
  return (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/** True when this address may receive email under the current mode. */
export function canEmailAddress(address: string) {
  const normalized = address.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;
  if (process.env.EMAIL_MODE === "live") return true;
  return allowList().includes(normalized);
}

export async function sendEmails(emails: OutgoingEmail[]) {
  if (!emailConfigured()) {
    return { sent: 0, skipped: emails.length };
  }

  const seen = new Set<string>();
  const allowed = emails.filter((email) => {
    const key = `${email.to.trim().toLowerCase()}|${email.subject}`;
    if (seen.has(key) || !canEmailAddress(email.to)) return false;
    seen.add(key);
    return true;
  });

  let sent = 0;

  for (let index = 0; index < allowed.length; index += RESEND_BATCH_LIMIT) {
    const chunk = allowed.slice(index, index + RESEND_BATCH_LIMIT);
    const payload = chunk.map((email) => ({
      from: process.env.EMAIL_FROM,
      to: [email.to.trim()],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }));

    try {
      const response = await fetch(RESEND_BATCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("Resend rejected a batch", response.status, detail.slice(0, 300));
        continue;
      }

      sent += chunk.length;
    } catch (error) {
      console.error("Resend request failed", error instanceof Error ? error.message : error);
    }
  }

  return { sent, skipped: emails.length - sent };
}
