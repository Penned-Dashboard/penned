export const DEFAULT_ACCOUNT_MANAGER = {
  name: "Sarah K.",
  firstName: "Sarah",
  email: "hello@fipublishing.com",
  initials: "SK",
};

export function accountManagerForClient(_clientProfileId?: string) {
  // Swap to a per-client mapping when Liam supplies manager assignments.
  return DEFAULT_ACCOUNT_MANAGER;
}

export const CALENDLY_BASE = "https://calendly.com/contact-howlpublishing/30min";

export function calendlyUrl(reason?: string) {
  if (!reason) return CALENDLY_BASE;
  return `${CALENDLY_BASE}?a1=${encodeURIComponent(reason)}`;
}
