import type { DashboardOrder, InvoiceItem } from "@/lib/orders";

export const topUpTiers = [
  {
    id: "standard",
    name: "Standard top-up",
    min: 0,
    max: 4999,
    discount: 0,
    discountLabel: "No discount",
    copy: "Pay-as-you-go rate. No minimum amount. Add what you need, when you need it.",
  },
  {
    id: "managed-5k",
    name: "$5,000–$9,999",
    min: 5000,
    max: 9999,
    discount: 5,
    discountLabel: "5% off every eligible Managed order",
    copy: "Save up to $499 on this top-up.",
  },
  {
    id: "managed-10k",
    name: "$10,000–$19,999",
    min: 10000,
    max: 19999,
    discount: 7.5,
    discountLabel: "7.5% off every eligible Managed order",
    copy: "Save up to $1,500 on this top-up.",
  },
  {
    id: "managed-20k",
    name: "$20,000+",
    min: 20000,
    max: Number.POSITIVE_INFINITY,
    discount: 10,
    discountLabel: "10% off every eligible Managed order",
    copy: "Save $2,000+ on this top-up.",
  },
] as const;

export function getTierForAmount(amount: number) {
  return (
    [...topUpTiers].reverse().find((tier) => amount >= tier.min) ?? topUpTiers[0]
  );
}

export function getContentBudgetSnapshot(orders: DashboardOrder[], invoices: InvoiceItem[]) {
  const completed = orders.filter((order) => order.status === "Accepted").length;
  const remaining = 3750;
  const currentTier = topUpTiers[2];
  const totalSaved = 937.5;
  const weeksRemaining = 4;
  const notEligible = completed < 3;
  const priorityState = notEligible
    ? "Not eligible"
    : invoices.length
      ? "Eligible, not activated"
      : "Eligible, not activated";

  const demoActivity = [
    { label: "Managed top-up", value: "+$5,000.00", note: "Prepaid wallet" },
    { label: "Rank article batch", value: "-$960.00", note: "Order deduction" },
    { label: "Blog post — Northstar Growth", value: "-$75.00", note: "Order deduction" },
    { label: "Revision credit", value: "+$37.50", note: "Refund / credit" },
  ];

  const liveActivity = orders.slice(0, 3).map((order) => ({
    label: `${order.name} · ${order.clientLabel}`,
    value: order.status === "Accepted" ? "-$275.00" : "Reserved",
    note: order.deadline,
  }));

  return {
    remaining,
    remainingLabel: `$${remaining.toLocaleString()} remaining`,
    currentTier,
    totalSaved,
    weeksRemaining,
    billingMode: remaining > 0 ? "Prepaid wallet" : "Pay per order",
    priorityState,
    notEligible,
    recentActivity: [...demoActivity, ...liveActivity].slice(0, 6),
  };
}

export function estimateArticles(amount: number, rate = 0.05, words = 800) {
  if (amount <= 0) {
    return 0;
  }

  return Math.floor(amount / (rate * words));
}
