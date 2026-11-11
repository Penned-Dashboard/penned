export const DEFAULT_ACCOUNT_MANAGER = {
  name: "Fairmay Alcobendras",
  firstName: "Fairmay",
  email: "support@penned.io",
  initials: "FA",
  /** Slack DM deep link — opens a message to Fairmay in the client hub. */
  messageUrl: "https://penned-clienthub.slack.com/team/U08T7E3E6DP",
  /** Photo pending from Liam — null falls back to initials. */
  photoUrl: null as string | null,
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
