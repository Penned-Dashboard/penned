import { NextResponse } from "next/server";
import { sendDailySummaries } from "@/lib/notifications";

/**
 * Daily summary emails. Called once a day by Vercel Cron (see vercel.json),
 * which sends "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set.
 * Without CRON_SECRET this route refuses every request.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await sendDailySummaries();
  return NextResponse.json({ ok: true, ...result });
}
