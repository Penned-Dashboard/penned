import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { getPriceIdForPlan, getStripeServerClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const user = await getCurrentAppUser();
  const plan = request.nextUrl.searchParams.get("plan") ?? "pro";
  const stripe = getStripeServerClient();
  const priceId = getPriceIdForPlan(plan);

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (user.role !== "client") {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }

  if (!stripe || !priceId) {
    return NextResponse.redirect(
      new URL("/client/billing?setup=stripe-missing", request.url),
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/billing?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/billing?checkout=cancelled`,
    customer_email: user.email,
    metadata: {
      client_profile_id: user.profileId,
      selected_plan: plan,
    },
  });

  return NextResponse.redirect(session.url ?? new URL("/client/billing", request.url));
}
