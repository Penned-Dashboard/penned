import { headers } from "next/headers";
import { NextResponse } from "next/server";
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clientProfileId = session.metadata?.client_profile_id;
    const selectedPlan = session.metadata?.selected_plan ?? "pro";

    if (clientProfileId) {
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
