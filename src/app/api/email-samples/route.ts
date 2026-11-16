import { NextResponse } from "next/server";
import { canEmailAddress, sendEmails } from "@/lib/email";
import { buildEmailSamples } from "@/lib/email-samples";
import { renderEmail } from "@/lib/email-templates";

/**
 * Preview-only: sends one sample of every notification email to a single
 * address, for reviewing the set in a real inbox.
 * GET /api/email-samples?token=EMAIL_SAMPLES_TOKEN&to=address
 * - Never runs on Production.
 * - Needs EMAIL_SAMPLES_TOKEN to be set and to match.
 * - `to` must be allowed by the email settings (EMAIL_ALLOWLIST until live).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = process.env.EMAIL_SAMPLES_TOKEN;
  if (!token || url.searchParams.get("token") !== token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const to = (url.searchParams.get("to") ?? "").trim();
  if (!canEmailAddress(to)) {
    return NextResponse.json({ ok: false, message: "Address not allowed." }, { status: 400 });
  }

  const samples = buildEmailSamples();
  const emails = samples.map((sample, index) => {
    const rendered = renderEmail(sample.content);
    const number = String(index + 1).padStart(2, "0");
    return {
      to,
      subject: `[Sample ${number} · ${sample.audience}] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    };
  });

  const result = await sendEmails(emails);
  return NextResponse.json({ ok: true, samples: samples.length, ...result });
}
