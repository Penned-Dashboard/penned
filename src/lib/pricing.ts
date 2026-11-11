/**
 * Shared pricing module — single source for every price, total, discount and due date.
 * Liam handover (6 Nov 2026). Admin-tunable defaults live here until settings UI exists.
 */

export type WritingTier = "standard" | "signature" | "specialist";
export type DeliveryOption = "standard" | "priority" | "rush";
export type ServiceTierDb = "on-demand" | "signature" | "rank";

/** Tunable rates in cents per word (USD). Change here or later via admin settings. */
export const pricingSettings = {
  standardCents: 6,
  signatureCents: 15,
  specialistCents: 35,
  specialistMedicalLegalCents: 45,
  standardLanguageSurchargeCents: 2,
  rushByTierCents: {
    standard: 2,
    signature: 3,
    specialist: 10,
  } as Record<WritingTier, number>,
  deliveryHours: {
    standard: 72,
    priority: 72,
    rush: 48,
  } as Record<DeliveryOption, number>,
  lateDeliveryCreditPercent: 25,
  volumeDiscounts: [
    { minCents: 500_000, maxCents: 1_249_999, percent: 5 },
    { minCents: 1_250_000, maxCents: 2_499_999, percent: 7.5 },
    { minCents: 2_500_000, maxCents: Number.POSITIVE_INFINITY, percent: 10 },
  ],
  /** Flat-priced content types (cents). Tier picker + add-ons hidden for these. */
  flatPricesCents: {
    newsletter: 26_000,
    "product-page": 42_000,
    whitepaper: 95_000,
    "email-sequence": 10_000, // per email when live
    "case-study": 10_000, // when live
  } as Record<string, number>,
  /** UK agencies that add UK company info are charged VAT on content writing bills. */
  ukVatPercent: 20,
};

export function isUkCompanyBilling(input?: {
  isUkCompany?: boolean | null;
  billingCountry?: string | null;
} | null) {
  if (!input) return false;
  if (input.isUkCompany) return true;
  const country = (input.billingCountry ?? "").trim().toLowerCase();
  return (
    country === "uk" ||
    country === "united kingdom" ||
    country === "gb" ||
    country === "great britain" ||
    country === "england" ||
    country === "scotland" ||
    country === "wales" ||
    country === "northern ireland"
  );
}

export function ukVatCents(subtotalCents: number) {
  return Math.round((subtotalCents * pricingSettings.ukVatPercent) / 100);
}

export const MEDICAL_LEGAL_INDUSTRY_HINTS = [
  "medical",
  "medicine",
  "healthcare",
  "health care",
  "pharma",
  "pharmaceutical",
  "clinical",
  "legal",
  "law",
  "lawyer",
  "attorney",
  "compliance",
];

export const writingTier: Array<{
  value: WritingTier;
  label: string;
  rateLabel: string;
  description: string;
  chooserHint: string;
}> = [
  {
    value: "standard",
    label: "Standard",
    rateLabel: `$${((pricingSettings.standardCents) / 100).toFixed(2)} per word`,
    description: "AI-assisted drafting, then a human edit and proofread. For keeping every client's content calendar full.",
    chooserHint: "Need volume? Standard.",
  },
  {
    value: "signature",
    label: "Signature",
    rateLabel: `$${((pricingSettings.signatureCents) / 100).toFixed(2)} per word`,
    description: "Written by a professional writer, with no AI. Comes with an AI-detection report.",
    chooserHint: "Client says no AI? Signature.",
  },
  {
    value: "specialist",
    label: "Specialist",
    rateLabel: `from $${((pricingSettings.specialistCents) / 100).toFixed(2)} per word`,
    description: `Written by a writer who knows your client's industry, with a senior edit. Medical and legal $${((pricingSettings.specialistMedicalLegalCents) / 100).toFixed(2)} per word.`,
    chooserHint: "Regulated or technical niche? Specialist.",
  },
];

export function writingTierFromDb(serviceTier: string | null | undefined): WritingTier {
  if (serviceTier === "rank") return "specialist";
  if (serviceTier === "signature") return "signature";
  return "standard";
}

export function writingTierToDb(tier: WritingTier): ServiceTierDb {
  if (tier === "specialist") return "rank";
  if (tier === "signature") return "signature";
  return "on-demand";
}

export function isMedicalOrLegalIndustry(industry?: string | null) {
  const value = (industry ?? "").trim().toLowerCase();
  if (!value) return false;
  return MEDICAL_LEGAL_INDUSTRY_HINTS.some((hint) => value.includes(hint));
}

export function isEnglishLanguage(language?: string | null) {
  const value = (language ?? "English").trim().toLowerCase();
  return value === "english" || value.startsWith("english ");
}

export function isFlatPricedType(contentTypeKey?: string | null) {
  if (!contentTypeKey) return false;
  return contentTypeKey in pricingSettings.flatPricesCents;
}

export function getFlatPriceCents(contentTypeKey: string) {
  return pricingSettings.flatPricesCents[contentTypeKey] ?? null;
}

export function getTierRateCents({
  tier,
  industry,
}: {
  tier: WritingTier;
  industry?: string | null;
}) {
  if (tier === "standard") return pricingSettings.standardCents;
  if (tier === "signature") return pricingSettings.signatureCents;
  if (isMedicalOrLegalIndustry(industry)) {
    return pricingSettings.specialistMedicalLegalCents;
  }
  return pricingSettings.specialistCents;
}

export function getLanguageSurchargeCents(tier: WritingTier, language?: string | null) {
  if (tier !== "standard") return 0;
  if (isEnglishLanguage(language)) return 0;
  return pricingSettings.standardLanguageSurchargeCents;
}

export function getRushSurchargeCents(tier: WritingTier, delivery: DeliveryOption) {
  if (delivery !== "rush") return 0;
  return pricingSettings.rushByTierCents[tier];
}

export type OrderPriceInput = {
  words: number;
  tier: WritingTier;
  language?: string | null;
  delivery?: DeliveryOption;
  industry?: string | null;
  contentTypeKey?: string | null;
  /** Charge 20% UK VAT on top when the client is a UK company. */
  applyUkVat?: boolean;
};

export type OrderPriceBreakdown = {
  words: number;
  tier: WritingTier;
  tierRateCents: number;
  languageSurchargeCents: number;
  rushSurchargeCents: number;
  ratePerWordCents: number;
  subtotalCents: number;
  vatCents: number;
  vatPercent: number;
  isFlat: boolean;
  flatPriceCents: number | null;
  totalCents: number;
  deliveryHours: number;
  lines: Array<{ label: string; amountCents: number }>;
};

export function calculateOrderPrice(input: OrderPriceInput): OrderPriceBreakdown {
  const delivery = input.delivery ?? "standard";
  const words = Math.max(0, Math.round(input.words || 0));
  const flat = input.contentTypeKey ? getFlatPriceCents(input.contentTypeKey) : null;
  const applyUkVat = Boolean(input.applyUkVat);

  if (flat != null) {
    const vatCents = applyUkVat ? ukVatCents(flat) : 0;
    const lines: Array<{ label: string; amountCents: number }> = [
      { label: "Flat price", amountCents: flat },
    ];
    if (vatCents > 0) {
      lines.push({ label: `UK VAT (${pricingSettings.ukVatPercent}%)`, amountCents: vatCents });
    }
    return {
      words,
      tier: input.tier,
      tierRateCents: 0,
      languageSurchargeCents: 0,
      rushSurchargeCents: 0,
      ratePerWordCents: 0,
      subtotalCents: flat,
      vatCents,
      vatPercent: applyUkVat ? pricingSettings.ukVatPercent : 0,
      isFlat: true,
      flatPriceCents: flat,
      totalCents: flat + vatCents,
      deliveryHours: pricingSettings.deliveryHours[delivery],
      lines,
    };
  }

  const tierRateCents = getTierRateCents({
    tier: input.tier,
    industry: input.industry,
  });
  const languageSurchargeCents = getLanguageSurchargeCents(input.tier, input.language);
  const rushSurchargeCents = getRushSurchargeCents(input.tier, delivery);
  const ratePerWordCents = tierRateCents + languageSurchargeCents + rushSurchargeCents;
  const subtotalCents = words * ratePerWordCents;
  const vatCents = applyUkVat ? ukVatCents(subtotalCents) : 0;

  const lines: Array<{ label: string; amountCents: number }> = [
    {
      label: `${words.toLocaleString()} words × $${(tierRateCents / 100).toFixed(2)}`,
      amountCents: words * tierRateCents,
    },
  ];
  if (languageSurchargeCents > 0) {
    lines.push({
      label: `Language +$${(languageSurchargeCents / 100).toFixed(2)}/word`,
      amountCents: words * languageSurchargeCents,
    });
  }
  if (rushSurchargeCents > 0) {
    lines.push({
      label: `Rush +$${(rushSurchargeCents / 100).toFixed(2)}/word`,
      amountCents: words * rushSurchargeCents,
    });
  }
  if (vatCents > 0) {
    lines.push({
      label: `UK VAT (${pricingSettings.ukVatPercent}%)`,
      amountCents: vatCents,
    });
  }

  return {
    words,
    tier: input.tier,
    tierRateCents,
    languageSurchargeCents,
    rushSurchargeCents,
    ratePerWordCents,
    subtotalCents,
    vatCents,
    vatPercent: applyUkVat ? pricingSettings.ukVatPercent : 0,
    isFlat: false,
    flatPriceCents: null,
    totalCents: subtotalCents + vatCents,
    deliveryHours: pricingSettings.deliveryHours[delivery],
    lines,
  };
}

export function formatUsdFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function dueLabelBeforeAcceptance(delivery: DeliveryOption = "standard") {
  const hours = pricingSettings.deliveryHours[delivery];
  return `Due within ${hours} hours of acceptance`;
}

export function dueDateAfterAcceptance(acceptedAt: Date, delivery: DeliveryOption = "standard") {
  const hours = pricingSettings.deliveryHours[delivery];
  return new Date(acceptedAt.getTime() + hours * 60 * 60 * 1000);
}

export function lateDeliveryCreditCents(orderTotalCents: number) {
  return Math.round((orderTotalCents * pricingSettings.lateDeliveryCreditPercent) / 100);
}

export function volumeDiscountPercent(topUpCents: number) {
  for (const tier of pricingSettings.volumeDiscounts) {
    if (topUpCents >= tier.minCents && topUpCents <= tier.maxCents) {
      return tier.percent;
    }
  }
  return 0;
}

export function volumeDiscountCreditCents(topUpCents: number) {
  const percent = volumeDiscountPercent(topUpCents);
  return Math.round((topUpCents * percent) / 100);
}

export function nextVolumeTierNudge(topUpCents: number) {
  const next = pricingSettings.volumeDiscounts.find((tier) => topUpCents < tier.minCents);
  if (!next) return null;
  const moreCents = next.minCents - topUpCents;
  return {
    moreCents,
    percent: next.percent,
    message: `Top up ${formatUsdFromCents(moreCents)} more to get ${next.percent}% extra credit`,
  };
}

/** Worked examples from Liam's handover — use as test cases. */
export const pricingWorkedExamples = [
  { label: "1,000 · Standard · English", input: { words: 1000, tier: "standard" as const, language: "English" }, totalCents: 6000 },
  { label: "1,000 · Standard · Spanish", input: { words: 1000, tier: "standard" as const, language: "Spanish" }, totalCents: 8000 },
  { label: "1,000 · Signature · English", input: { words: 1000, tier: "signature" as const, language: "English" }, totalCents: 15000 },
  { label: "1,000 · Signature · French", input: { words: 1000, tier: "signature" as const, language: "French" }, totalCents: 15000 },
  { label: "1,000 · Specialist · English", input: { words: 1000, tier: "specialist" as const, language: "English" }, totalCents: 35000 },
  { label: "1,000 · Specialist · German", input: { words: 1000, tier: "specialist" as const, language: "German" }, totalCents: 35000 },
  { label: "1,000 · Specialist medical · English", input: { words: 1000, tier: "specialist" as const, language: "English", industry: "medical" }, totalCents: 45000 },
  { label: "1,500 · Signature · English · Rush", input: { words: 1500, tier: "signature" as const, language: "English", delivery: "rush" as const }, totalCents: 27000 },
  { label: "800 · Standard · English · Rush", input: { words: 800, tier: "standard" as const, language: "English", delivery: "rush" as const }, totalCents: 6400 },
  { label: "1,500 · Standard · German · Rush", input: { words: 1500, tier: "standard" as const, language: "German", delivery: "rush" as const }, totalCents: 15000 },
  { label: "Bulk 3×1,200 · Standard · English", input: { words: 3600, tier: "standard" as const, language: "English" }, totalCents: 21600 },
] as const;

export function assertPricingWorkedExamples() {
  const failures: string[] = [];
  for (const example of pricingWorkedExamples) {
    const result = calculateOrderPrice(example.input);
    if (result.totalCents !== example.totalCents) {
      failures.push(
        `${example.label}: expected ${example.totalCents}, got ${result.totalCents}`,
      );
    }
  }
  return failures;
}

/** Card label for per-word types — always Standard floor rate. */
export function perWordCardPriceLabel() {
  return `From ${formatUsdFromCents(pricingSettings.standardCents)} per word`;
}
