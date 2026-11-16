import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { notifyTopUp, queueNotification } from "@/lib/notifications";
import { volumeDiscountCreditCents } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const supabase = createServerSupabaseClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret || !supabase) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Idempotency: never process the same Stripe event twice.
  const { error: eventInsertError } = await supabase.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  });
  if (eventInsertError) {
    if (eventInsertError.code === "23505" || /duplicate|unique/i.test(eventInsertError.message)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Table may not exist yet — continue so subscriptions still update; run security-launch-hardening.sql.
    console.error("stripe_webhook_events insert failed", eventInsertError.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clientProfileId = session.metadata?.client_profile_id;
    const kind = session.metadata?.kind ?? "";
    const selectedPlan = session.metadata?.selected_plan ?? "pro";

    if (clientProfileId && kind === "content_budget_top_up") {
      const amountCents =
        typeof session.amount_total === "number"
          ? session.amount_total
          : Math.round(Number(session.metadata?.top_up_amount ?? 0) * 100);
      if (amountCents > 0) {
        const bonusCents = volumeDiscountCreditCents(amountCents);
        await creditClientWallet({
          supabase,
          clientProfileId,
          amountCents,
          bonusCents,
          stripeEventId: event.id,
          note: `Top-up via Stripe checkout ${session.id}`,
        });
        queueNotification(() => notifyTopUp(clientProfileId, amountCents, bonusCents));
      }
    } else if (clientProfileId) {
      const payload = {
        client_id: clientProfileId,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id:
          typeof session.subscription === "string" ? session.subscription : null,
        plan_name: selectedPlan,
        status: "active",
      };
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("client_id", clientProfileId)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from("subscriptions").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("subscriptions").insert(payload);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const currentPeriodEnd = (
      subscription as { current_period_end?: number | null }
    ).current_period_end;

    await supabase
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  return NextResponse.json({ received: true });
}

async function creditClientWallet({
  supabase,
  clientProfileId,
  amountCents,
  bonusCents,
  stripeEventId,
  note,
}: {
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>;
  clientProfileId: string;
  amountCents: number;
  bonusCents: number;
  stripeEventId: string;
  note: string;
}) {
  const rows = [
    {
      client_id: clientProfileId,
      kind: "top_up",
      amount_cents: amountCents,
      stripe_event_id: `${stripeEventId}:top_up`,
      note,
    },
    ...(bonusCents > 0
      ? [
          {
            client_id: clientProfileId,
            kind: "prepay_bonus",
            amount_cents: bonusCents,
            stripe_event_id: `${stripeEventId}:bonus`,
            note: "Pre-pay bonus credit",
          },
        ]
      : []),
  ];

  const { error: ledgerError } = await supabase.from("wallet_ledger").insert(rows);
  if (ledgerError && ledgerError.code !== "23505") {
    console.error("wallet_ledger insert failed", ledgerError.message);
  }

  const totalCredit = amountCents + bonusCents;
  const { data: clientWallet } = await supabase
    .from("client_wallets")
    .select("id, available_cents")
    .eq("client_id", clientProfileId)
    .maybeSingle();

  if (clientWallet?.id) {
    await supabase
      .from("client_wallets")
      .update({ available_cents: (clientWallet.available_cents ?? 0) + totalCredit })
      .eq("id", clientWallet.id);
    return;
  }

  const { error: createError } = await supabase.from("client_wallets").insert({
    client_id: clientProfileId,
    available_cents: totalCredit,
    pending_cents: 0,
  });
  if (createError) {
    console.error("client_wallets credit failed", createError.message);
  }
}
