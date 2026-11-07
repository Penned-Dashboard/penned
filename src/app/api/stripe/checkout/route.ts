import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { getPriceIdForPlan, getStripeServerClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const user = await getCurrentAppUser();
  const amountParam = request.nextUrl.searchParams.get("amount");
  const plan = request.nextUrl.searchParams.get("plan") ?? "basic";
  const amount = Math.max(0, Number(amountParam) || 0);
  const stripe = getStripeServerClient();
  const priceId = getPriceIdForPlan(plan);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (user.role !== "client") {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }

  // Preview / missing Stripe: still complete the UX loop Liam asked for.
  if (!stripe || (!priceId && amount <= 0)) {
    if (amount > 0) {
      return NextResponse.redirect(
        new URL(
          `/client/content-budget?checkout=success&amount=${encodeURIComponent(String(amount))}`,
          request.url,
        ),
      );
    }
    return NextResponse.redirect(
      new URL("/client/content-budget?setup=stripe-missing", request.url),
    );
  }

  if (amount > 0) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Penned content budget top-up",
              description: `Add $${amount.toLocaleString()} to your prepaid content budget`,
            },
          },
        },
      ],
      success_url: `${appUrl}/client/content-budget?checkout=success&amount=${encodeURIComponent(String(amount))}`,
      cancel_url: `${appUrl}/client/content-budget/top-up?checkout=cancelled`,
      customer_email: user.email,
      metadata: {
        client_profile_id: user.profileId,
        top_up_amount: String(amount),
        kind: "content_budget_top_up",
      },
    });

    return NextResponse.redirect(session.url ?? new URL("/client/content-budget/top-up", request.url));
  }

  if (!priceId) {
    return NextResponse.redirect(
      new URL("/client/content-budget?setup=stripe-missing", request.url),
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/client/billing?checkout=success`,
    cancel_url: `${appUrl}/client/billing?checkout=cancelled`,
    customer_email: user.email,
    metadata: {
      client_profile_id: user.profileId,
      selected_plan: plan,
    },
  });

  return NextResponse.redirect(session.url ?? new URL("/client/billing", request.url));
}
