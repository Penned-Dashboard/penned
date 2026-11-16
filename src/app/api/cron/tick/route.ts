import { NextResponse } from "next/server";
import { runNotificationTick } from "@/lib/notification-scheduler";

/**
 * Timed emails (deadline reminders, alerts, 08:00 UK summaries).
 * Called every 15 minutes by Supabase pg_cron, and once a day by Vercel Cron
 * as a fallback (vercel.json). Both send "Authorization: Bearer $CRON_SECRET".
 * Without CRON_SECRET this route refuses every request.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await runNotificationTick();
  return NextResponse.json({ ok: true, ...result });
}
