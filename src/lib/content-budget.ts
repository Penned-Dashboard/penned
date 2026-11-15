import type { DashboardOrder, InvoiceItem } from "@/lib/orders";
import {
  formatUsdFromCents,
  nextVolumeTierNudge,
  pricingSettings,
  volumeDiscountCreditCents,
  volumeDiscountPercent,
} from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getClientWalletAvailableCents(clientProfileId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("client_wallets")
    .select("available_cents")
    .eq("client_id", clientProfileId)
    .maybeSingle();

  if (error || !data) return 0;
  return Math.max(0, data.available_cents ?? 0);
}

export const topUpTiers = [
  {
    id: "standard",
    name: "Under $5,000",
    min: 0,
    max: 4999,
    discount: 0,
    discountLabel: "No extra credit",
    copy: "Pay-as-you-go. Add what you need, when you need it.",
  },
  {
    id: "managed-5k",
    name: "$5,000–$12,499",
    min: 5000,
    max: 12499,
    discount: 5,
    discountLabel: "5% extra credit",
    copy: "Up to $625 back as extra credit.",
  },
  {
    id: "managed-10k",
    name: "$12,500–$24,999",
    min: 12500,
    max: 24999,
    discount: 7.5,
    discountLabel: "7.5% extra credit",
    copy: "Up to $1,875 back as extra credit.",
  },
  {
    id: "managed-20k",
    name: "$25,000+",
    min: 25000,
    max: Number.POSITIVE_INFINITY,
    discount: 10,
    discountLabel: "10% extra credit",
    copy: "$2,500+ back as extra credit.",
  },
] as const;

export function getTierForAmount(amount: number) {
  return (
    [...topUpTiers].reverse().find((tier) => amount >= tier.min) ?? topUpTiers[0]
  );
}

export function getContentBudgetSnapshot(
  orders: DashboardOrder[],
  invoices: InvoiceItem[],
  options?: { availableCents?: number; allowDemoFigures?: boolean },
) {
  const completed = orders.filter((order) =>
    ["Accepted", "Approved", "Completed"].includes(order.status),
  ).length;
  const hasLiveData = orders.length > 0 || invoices.length > 0;
  const allowDemoFigures = options?.allowDemoFigures === true;
  const walletCents = Math.max(0, options?.availableCents ?? 0);

  // Never invent a balance in production. Demo figures only when explicitly allowed.
  const demoTopUpCents = allowDemoFigures && hasLiveData && walletCents === 0 ? 500_000 : 0;
  const demoCreditCents = volumeDiscountCreditCents(demoTopUpCents);
  const demoSpendCents = allowDemoFigures && hasLiveData && walletCents === 0 ? 125_000 : 0;
  const remainingCents =
    walletCents > 0
      ? walletCents
      : Math.max(0, demoTopUpCents + demoCreditCents - demoSpendCents);
  const tierBaseCents = walletCents > 0 ? walletCents : demoTopUpCents;
  const currentTier = getTierForAmount(tierBaseCents / 100);
  const totalSaved = (walletCents > 0 ? 0 : demoCreditCents) / 100;
  const weeksRemaining =
    demoSpendCents > 0 ? Math.max(1, Math.round(remainingCents / (demoSpendCents / 4))) : null;
  const notEligible = completed < 3;
  const priorityState = notEligible
    ? "Not yet eligible"
    : "You're on standard terms: top up first, then order.";

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const recentActivity =
    allowDemoFigures && hasLiveData && walletCents === 0
      ? [
          {
            label: "Top-up",
            value: `+${formatUsdFromCents(demoTopUpCents)}`,
            note: today,
          },
          {
            label: `Pre-pay credit (${volumeDiscountPercent(demoTopUpCents)}%)`,
            value: `+${formatUsdFromCents(demoCreditCents)}`,
            note: today,
          },
          ...orders.slice(0, 3).map((order) => ({
            label: `Order: ${order.name}`,
            value: ["Accepted", "Approved", "Completed"].includes(order.status)
              ? "-$90.00"
              : "Reserved",
            note: order.deadline,
          })),
        ].slice(0, 6)
      : orders.slice(0, 6).map((order) => ({
          label: `Order: ${order.name}`,
          value: ["Accepted", "Approved", "Completed"].includes(order.status)
            ? "Completed"
            : order.status,
          note: order.deadline,
        }));

  return {
    remaining: remainingCents / 100,
    remainingLabel: `${formatUsdFromCents(remainingCents)} left`,
    currentTier,
    totalSaved,
    weeksRemaining,
    billingMode: remainingCents > 0 ? "Prepaid wallet" : "Pay per order",
    priorityState,
    notEligible,
    recentActivity,
    hasLiveData,
    volumeTable: pricingSettings.volumeDiscounts,
    nextTierNudge: nextVolumeTierNudge(tierBaseCents),
  };
}

export function estimateArticles(amount: number, rate = 0.06, words = 1000) {
  if (amount <= 0) {
    return 0;
  }

  return Math.floor(amount / (rate * words));
}
