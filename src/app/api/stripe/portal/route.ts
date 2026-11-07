import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { getStripeServerClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const user = await getCurrentAppUser();
  const stripe = getStripeServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (user.role !== "client") {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }

  if (!stripe) {
    return NextResponse.redirect(new URL("/client/billing?setup=stripe-missing", request.url));
  }

  // Without a stored Stripe customer id yet, send people through checkout setup UX.
  try {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    if (!customerId) {
      return NextResponse.redirect(new URL("/client/billing?setup=stripe-missing", request.url));
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/client/billing?checkout=success`,
    });

    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect(new URL("/client/billing?setup=stripe-missing", request.url));
  }
}
