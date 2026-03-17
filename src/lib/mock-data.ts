import type { FormField, Metric } from "@/lib/types";

export const executionRoadmap = [
  { weeks: "Weeks 1-2", title: "Foundation", goal: "Auth, roles, dashboard shell, schema, CI/CD." },
  { weeks: "Weeks 3-4", title: "Client ordering", goal: "Order intake, statuses, review queue, catalog." },
  { weeks: "Weeks 5-6", title: "Writer marketplace", goal: "Claim flow, submissions, wallet tracking." },
  { weeks: "Week 7", title: "Review loop", goal: "Docs links, comments, revisions, audit trail." },
  { weeks: "Weeks 8-9", title: "Payments", goal: "Subscriptions, invoices, Connect payouts, approvals." },
  { weeks: "Week 10", title: "Admin controls", goal: "Ranking rules, disputes, feature gating, premium ops." },
  { weeks: "Weeks 11-12", title: "Hardening", goal: "Analytics, notifications, polish, beta readiness." },
];

export const clientHighlights = [
  "Order form with briefs, CTAs, references, due dates, and content-type selection.",
  "Review queue for drafts, requested edits, and final acceptance decisions.",
  "Billing workspace with subscription state, invoice history, and premium features.",
];

export const writerHighlights = [
  "Claimable jobs board with filters for pay, client, industry, and turnaround.",
  "Submission status with revisions, Google Doc links, and payout visibility.",
  "Simple ranking visibility so writers understand performance and fairness inputs.",
];

export const adminHighlights = [
  "Marketplace oversight for orders, disputes, content types, and payout approvals.",
  "Ranking engine control points for completions, ratings, penalties, and QA imports.",
  "Revenue and operational metrics needed to run a lean publishing team.",
];

const clientMetrics: Metric[] = [
  { label: "Active orders", value: "14", hint: "8 drafting, 4 in review, 2 blocked on feedback." },
  { label: "In review", value: "5", hint: "Three need approval today and two need revision calls." },
  { label: "Completed", value: "126", hint: "Month-to-date delivered work across SEO, thought leadership, and newsletters." },
  { label: "Plan", value: "Pro", hint: "Preferred writers, invoice exports, and Slack support are enabled." },
];

const orderFormFields: FormField[] = [
  { label: "Content title", placeholder: "AI workflow guide for operations leaders", kind: "text" },
  { label: "Content type", placeholder: "Blog post / case study / landing page", kind: "text" },
  { label: "Target audience", placeholder: "B2B SaaS operations managers", kind: "text" },
  { label: "Due date", placeholder: "", kind: "date" },
  { label: "Primary CTA", placeholder: "Book a demo with Penned", kind: "text", large: true },
  { label: "Reference links", placeholder: "https://example.com, docs, competitors, internal notes", kind: "url", large: true },
  { label: "Brief", placeholder: "Goals, keywords, angle, tone, and guardrails.", kind: "textarea", large: true },
];

export const clientDashboard = {
  metrics: clientMetrics,
  orderFormFields,
  reviewQueue: [
    { title: "Q2 editorial roadmap", writer: "Maya Chen", due: "Needs decision today", status: "awaiting approval" },
    { title: "Case study draft for Radian", writer: "Jordan Lee", due: "Revision requested", status: "changes pending" },
    { title: "SEO cluster brief", writer: "Tina Park", due: "Received 2 hours ago", status: "new submission" },
  ],
  activeOrders: [
    { name: "Founders newsletter #18", contentType: "Newsletter", writer: "Ava Wilson", status: "Drafting", deadline: "Due Apr 26" },
    { name: "Product-led growth article", contentType: "Blog post", writer: "Dev Patel", status: "In review", deadline: "Review by Apr 24" },
    { name: "Homepage rewrite", contentType: "Landing page", writer: "Maya Chen", status: "Revision", deadline: "Revision due Apr 25" },
  ],
  invoices: [
    { id: "INV-2025-041", date: "April 3, 2025", amount: "$1,200", status: "Paid" },
    { id: "INV-2025-032", date: "March 3, 2025", amount: "$1,200", status: "Paid" },
    { id: "INV-2025-021", date: "February 3, 2025", amount: "$1,200", status: "Paid" },
  ],
};

const writerMetrics: Metric[] = [
  { label: "Current rank", value: "#4", hint: "Weighted by recent wins, ratings, and QA deductions." },
  { label: "Rating", value: "4.8", hint: "Average client score across the last 20 accepted jobs." },
  { label: "This month", value: "$4,860", hint: "$2,340 is available and $2,520 is pending approval." },
  { label: "Active jobs", value: "6", hint: "Three drafts in progress, two in revision, one queued." },
];

export const writerDashboard = {
  metrics: writerMetrics,
  filters: ["SaaS", "SEO", "$300+", "Fast turnaround", "Thought leadership"],
  jobsBoard: [
    { title: "Customer onboarding guide", client: "Arcflow", industry: "B2B SaaS", pay: "$420", turnaround: "3-day turnaround" },
    { title: "Series B announcement page", client: "Northstar", industry: "Fintech", pay: "$560", turnaround: "5-day turnaround" },
    { title: "SEO refresh for integration pages", client: "Trelli", industry: "Developer tools", pay: "$310", turnaround: "2-day turnaround" },
  ],
  submissions: [
    { title: "Warehouse automation article", client: "Kepler", docType: "Blog post", status: "Awaiting review", deadline: "Submitted today" },
    { title: "Lifecycle email sequence", client: "Arcflow", docType: "Email copy", status: "Revision requested", deadline: "Revise by Apr 24" },
    { title: "Series B launch page", client: "Northstar", docType: "Landing page", status: "Accepted", deadline: "Accepted yesterday" },
  ],
  wallet: {
    available: "$2,340",
    pending: "$2,520",
    activity: [
      { label: "Accepted: Series B launch page", date: "Apr 18, 2025", amount: "+$560" },
      { label: "Pending: Lifecycle email sequence", date: "Apr 15, 2025", amount: "+$340" },
      { label: "Payout sent to bank", date: "Apr 9, 2025", amount: "-$1,800" },
    ],
  },
  rankings: [
    { rank: "1", name: "Ava Wilson", note: "Strong approval rate, zero QA deductions.", score: "182 pts", rating: "4.9 rating" },
    { rank: "2", name: "Jordan Lee", note: "High volume and fast turnaround.", score: "174 pts", rating: "4.8 rating" },
    { rank: "3", name: "Maya Chen", note: "Recent acceptance streak boosts weighting.", score: "169 pts", rating: "4.8 rating" },
    { rank: "4", name: "You", note: "One QA deduction this week offset by two wins.", score: "161 pts", rating: "4.8 rating" },
  ],
};

const adminMetrics: Metric[] = [
  { label: "Revenue", value: "$48.2k", hint: "Subscription and order revenue this month." },
  { label: "Jobs this month", value: "218", hint: "Orders created across all content types." },
  { label: "Active writers", value: "37", hint: "24 currently available, 13 with active workloads." },
  { label: "Open disputes", value: "3", hint: "One payout issue, two revision scope disputes." },
];

export const adminDashboard = {
  metrics: adminMetrics,
  operationsQueue: [
    { title: "Radian payout discrepancy", owner: "Finance ops", state: "Needs approval", deadline: "Escalated 1h ago" },
    { title: "Thought leadership revision dispute", owner: "Client success", state: "Needs mediation", deadline: "Review by end of day" },
    { title: "Unassigned enterprise landing page", owner: "Marketplace", state: "Needs writer match", deadline: "Aging 9h" },
  ],
  contentTypes: [
    { name: "Blog post", turnaround: "3-5 business days", price: "$350 base", status: "Active" },
    { name: "Landing page", turnaround: "4-6 business days", price: "$550 base", status: "Active" },
    { name: "Case study", turnaround: "5-7 business days", price: "$700 base", status: "Pilot" },
  ],
  payouts: [
    { writer: "Maya Chen", requestedAt: "Requested Apr 21, 2025", amount: "$1,240", status: "Awaiting release" },
    { writer: "Dev Patel", requestedAt: "Requested Apr 20, 2025", amount: "$980", status: "Awaiting release" },
    { writer: "Ava Wilson", requestedAt: "Requested Apr 18, 2025", amount: "$1,860", status: "Released" },
  ],
  rankingRules: [
    { label: "Completed job", value: "+10", note: "Base credit for accepted work." },
    { label: "High rating bonus", value: "+5", note: "Applies when client rating is at least 4.5." },
    { label: "Decline or QA hit", value: "-5", note: "Use QA imports from the Google Sheet here." },
  ],
};
