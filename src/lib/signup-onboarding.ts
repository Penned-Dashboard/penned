/** Liam’s client registration brief (Oct 2026 PDF) + Typeform “What brought you here”. */

export const CLIENT_TYPEFORM_URL = "https://gt4g5d1246c.typeform.com/to/nD83OSCe";
export const CLIENT_TYPEFORM_EMBED_ID = "01M4GKF92G4CAE9XBTXTBHY6TX";

export const CONTENT_NEED_OPTIONS = [
  "Blog posts",
  "Articles",
  "AEO",
  "Multilingual content",
  "Website content",
  "Press releases",
  "Technical articles",
  "Thought leadership",
] as const;

export const INDUSTRY_OPTIONS = [
  "iGaming",
  "Crypto and fintech",
  "Insurance",
  "Medical",
  "Legal",
  "Other",
] as const;

export const CONTENT_SOURCE_OPTIONS = [
  "AI tools",
  "Freelancers",
  "A content marketplace",
  "In-house writers",
  "Other",
] as const;

export type ClientOnboardingAnswers = {
  agencyName?: string;
  contentNeeds?: string[];
  industries?: string[];
  contentSource?: string;
  typeformCompleted?: boolean;
  skippedAgency?: boolean;
};
