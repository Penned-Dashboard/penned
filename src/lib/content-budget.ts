import type { DashboardOrder, InvoiceItem } from "@/lib/orders";
import {
  formatUsdFromCents,
  nextVolumeTierNudge,
  pricingSettings,
  volumeDiscountCreditCents,
  volumeDiscountPercent,
} from "@/lib/pricing";

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

export function getContentBudgetSnapshot(orders: DashboardOrder[], invoices: InvoiceItem[]) {
  const completed = orders.filter((order) =>
    ["Accepted", "Approved", "Completed"].includes(order.status),
  ).length;
  const hasLiveData = orders.length > 0 || invoices.length > 0;

  // Until wallet ledger is wired end-to-end, keep a coherent demo only when live data exists.
  const demoTopUpCents = hasLiveData ? 500_000 : 0;
  const demoCreditCents = volumeDiscountCreditCents(demoTopUpCents);
  const demoSpendCents = hasLiveData ? 125_000 : 0;
  const remainingCents = Math.max(0, demoTopUpCents + demoCreditCents - demoSpendCents);
  const currentTier = getTierForAmount(demoTopUpCents / 100);
  const totalSaved = demoCreditCents / 100;
  const weeksRemaining = hasLiveData && demoSpendCents > 0 ? Math.max(1, Math.round(remainingCents / (demoSpendCents / 4))) : null;
  const notEligible = completed < 3;
  const priorityState = notEligible
    ? "Not yet eligible"
    : "You're on standard terms: top up first, then order.";

  const recentActivity = hasLiveData
    ? [
        {
          label: "Top-up",
          value: `+${formatUsdFromCents(demoTopUpCents)}`,
          note: "Prepaid wallet",
        },
        {
          label: `Pre-pay credit (${volumeDiscountPercent(demoTopUpCents)}%)`,
          value: `+${formatUsdFromCents(demoCreditCents)}`,
          note: "Extra credit",
        },
        ...orders.slice(0, 3).map((order) => ({
          label: `Order: ${order.name}`,
          value: order.status === "Accepted" ? "-$90.00" : "Reserved",
          note: order.deadline,
        })),
      ].slice(0, 6)
    : [];

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
    nextTierNudge: nextVolumeTierNudge(demoTopUpCents),
  };
}

export function estimateArticles(amount: number, rate = 0.06, words = 1000) {
  if (amount <= 0) {
    return 0;
  }

  return Math.floor(amount / (rate * words));
}
