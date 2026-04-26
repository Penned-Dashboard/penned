import Stripe from "stripe";

export function getStripeServerClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export function getPriceIdForPlan(plan: string) {
  if (plan === "basic") {
    return process.env.STRIPE_BASIC_PRICE_ID ?? "";
  }

  if (plan === "pro") {
    return process.env.STRIPE_PRO_PRICE_ID ?? "";
  }

  return "";
}
