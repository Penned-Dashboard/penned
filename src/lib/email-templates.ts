/**
 * Email copy and layout. Every template returns plain data; `renderEmail`
 * turns it into the HTML and text bodies. All dynamic text is escaped here,
 * so templates pass plain strings only.
 */

export type EmailLink = { label: string; url: string };

export type EmailBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "links"; items: EmailLink[] }
  | { kind: "link"; label: string; url: string };

export type EmailContent = {
  subject: string;
  /** First name for "Hi {name},". Omit for internal team emails. */
  greetingName?: string;
  blocks: EmailBlock[];
  button?: EmailLink;
  afterButton?: EmailBlock[];
  /** Link to the settings page where order updates can be turned off. */
  settingsUrl?: string;
};

const NAVY = "#17253f";
const LIME = "#ddf479";
/**
 * Logo images are always loaded from the live dashboard, so they also work in
 * emails sent from preview builds. PNG, because many inboxes block SVG.
 */
const BRAND_ASSETS = "https://app.penned.io/brand";
const PAGE = "#f4f7fb";
const MUTED = "#5b6678";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Keep subjects on one line and a sensible length. */
function cleanSubject(value: string) {
  const single = value.replace(/\s+/g, " ").trim();
  return single.length > 140 ? `${single.slice(0, 137)}...` : single;
}

function truncate(value: string, max = 1200) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 3)}...` : trimmed;
}

function blockHtml(block: EmailBlock): string {
  const p = `margin:0 0 16px;font-size:16px;line-height:24px;color:${NAVY};`;
  switch (block.kind) {
    case "p":
      return `<p style="${p}">${escapeHtml(block.text)}</p>`;
    case "list":
      return `<ul style="margin:0 0 16px;padding:0 0 0 20px;font-size:16px;line-height:24px;color:${NAVY};">${block.items
        .map((item) => `<li style="margin:0 0 4px;">${escapeHtml(item)}</li>`)
        .join("")}</ul>`;
    case "steps":
      return `<ol style="margin:0 0 16px;padding:0 0 0 20px;font-size:16px;line-height:24px;color:${NAVY};">${block.items
        .map((item) => `<li style="margin:0 0 4px;">${escapeHtml(item)}</li>`)
        .join("")}</ol>`;
    case "quote":
      return `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid ${LIME};background:${PAGE};font-size:16px;line-height:24px;color:${NAVY};white-space:pre-wrap;">${escapeHtml(truncate(block.text))}</blockquote>`;
    case "links":
      return `<ul style="margin:0 0 16px;padding:0 0 0 20px;font-size:16px;line-height:24px;color:${NAVY};">${block.items
        .map(
          (item) =>
            `<li style="margin:0 0 4px;"><a href="${escapeHtml(item.url)}" style="color:${NAVY};">${escapeHtml(item.label)}</a></li>`,
        )
        .join("")}</ul>`;
    case "link":
      return `<p style="${p}"><a href="${escapeHtml(block.url)}" style="color:${NAVY};font-weight:600;">${escapeHtml(block.label)}</a></p>`;
  }
}

function blockText(block: EmailBlock): string {
  switch (block.kind) {
    case "p":
      return block.text;
    case "list":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "steps":
      return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    case "quote":
      return truncate(block.text)
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "links":
      return block.items.map((item) => `- ${item.label}: ${item.url}`).join("\n");
    case "link":
      return `${block.label}: ${block.url}`;
  }
}

export function renderEmail(content: EmailContent) {
  const greeting = content.greetingName ? `Hi ${content.greetingName},` : "";
  const footer = "You're getting this email because you have a Penned account.";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td bgcolor="${NAVY}" style="background:${NAVY};border-radius:12px 12px 0 0;padding:20px 28px;">
<a href="https://penned.io" style="text-decoration:none;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding:0 12px 0 0;vertical-align:middle;"><img src="${BRAND_ASSETS}/penned-mark.png" width="36" height="36" alt="" style="display:block;border:0;width:36px;height:36px;"></td>
<td style="vertical-align:middle;"><img src="${BRAND_ASSETS}/penned-wordmark-light.png" width="100" height="26" alt="Penned" style="display:block;border:0;width:100px;height:26px;font-family:${FONT};font-size:22px;font-weight:700;color:#ffffff;"></td>
</tr></table>
</a>
</td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px 16px;font-family:${FONT};">
${greeting ? `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${NAVY};">${escapeHtml(greeting)}</p>` : ""}
${content.blocks.map(blockHtml).join("\n")}
${
  content.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td bgcolor="${LIME}" style="background:${LIME};border-radius:999px;"><a href="${escapeHtml(content.button.url)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:16px;font-weight:700;color:${NAVY};text-decoration:none;border-radius:999px;">${escapeHtml(content.button.label)}</a></td></tr></table>`
    : ""
}
${(content.afterButton ?? []).map(blockHtml).join("\n")}
${content.greetingName ? `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${NAVY};">The Penned team</p>` : ""}
</td></tr>
<tr><td style="padding:16px 4px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
${escapeHtml(footer)}${
    content.settingsUrl
      ? ` You can turn order updates on or off in your <a href="${escapeHtml(content.settingsUrl)}" style="color:${MUTED};">settings</a>.`
      : ""
  }
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const textParts = [
    greeting,
    ...content.blocks.map(blockText),
    content.button ? `${content.button.label}: ${content.button.url}` : "",
    ...(content.afterButton ?? []).map(blockText),
    content.greetingName ? "The Penned team" : "",
    "--",
    content.settingsUrl
      ? `${footer} You can turn order updates on or off in your settings: ${content.settingsUrl}`
      : footer,
  ].filter(Boolean);

  return {
    subject: cleanSubject(content.subject),
    html,
    text: textParts.join("\n\n"),
  };
}

/* ------------------------------------------------------------------ */
/* Shared shapes                                                       */
/* ------------------------------------------------------------------ */

export type OrderSummary = {
  title: string;
  contentType: string;
  wordCount: number | null;
  language: string;
  /** Already formatted, or "" when unknown. */
  dueLabel: string;
  /** Already formatted, or "" when unknown. */
  costLabel: string;
  url: string;
};

function specLine(order: Pick<OrderSummary, "contentType" | "wordCount" | "language">) {
  return [
    order.contentType,
    order.wordCount ? `${order.wordCount.toLocaleString("en-GB")} words` : "",
    order.language,
  ]
    .filter(Boolean)
    .join(", ");
}

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

export function clientWelcome(input: { firstName: string; newOrderUrl: string }): EmailContent {
  return {
    subject: "Welcome to Penned",
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: "Your Penned account is ready." },
      {
        kind: "p",
        text: "To place your first order, send us a brief: what you need, who it's for and when you need it. We check every brief before a writer starts, and we'll email you when your draft is ready to review.",
      },
      { kind: "p", text: "It's free to have an account. You only pay when you place an order." },
    ],
    button: { label: "Send my first brief", url: input.newOrderUrl },
    afterButton: [{ kind: "p", text: "If you have a question, reply to this email." }],
  };
}

export function clientOrderReceived(input: {
  firstName: string;
  order: OrderSummary;
  settingsUrl: string;
}): EmailContent {
  const { order } = input;
  return {
    subject: `We've got your order: ${order.title}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: "Thanks for your order. Here's what we have:" },
      {
        kind: "list",
        items: [
          order.title,
          specLine(order),
          order.dueLabel ? `Due: ${order.dueLabel}` : "",
          order.costLabel ? `Cost: ${order.costLabel}` : "",
        ].filter(Boolean),
      },
      {
        kind: "p",
        text: "We're checking your brief now. If anything is unclear, we'll ask before a writer starts. We'll email you when your draft is ready to review.",
      },
    ],
    button: { label: "View my order", url: order.url },
    settingsUrl: input.settingsUrl,
  };
}

export function clientBatchReceived(input: {
  firstName: string;
  orders: OrderSummary[];
  totalCostLabel: string;
  ordersUrl: string;
  settingsUrl: string;
}): EmailContent {
  const count = input.orders.length;
  return {
    subject: `We've got your ${count} orders`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `Thanks for your bulk order. Here are the ${count} pieces we have:` },
      {
        kind: "list",
        items: input.orders.map((order) => `${order.title} (${specLine(order)})`),
      },
      ...(input.totalCostLabel
        ? [{ kind: "p" as const, text: `Total cost: ${input.totalCostLabel}` }]
        : []),
      {
        kind: "p",
        text: "We're checking your briefs now. If anything is unclear, we'll ask before a writer starts.",
      },
      {
        kind: "p",
        text: "To keep your inbox clear, we won't email you about every piece. We'll tell you when the first draft is ready, send one summary a day while more arrive, and tell you when they're all done.",
      },
    ],
    button: { label: "View my orders", url: input.ordersUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientDraftReady(input: {
  firstName: string;
  orderTitle: string;
  orderUrl: string;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: `Your draft is ready to review: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `Your draft of "${input.orderTitle}" is ready for you.` },
      {
        kind: "p",
        text: "Read it through, then either approve it or ask for changes. If you want changes, tell us what to fix and your writer will revise it.",
      },
    ],
    button: { label: "Review my draft", url: input.orderUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientRevisedDraftReady(input: {
  firstName: string;
  orderTitle: string;
  orderUrl: string;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: `Your revised draft is ready: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `Your writer has made the changes you asked for on "${input.orderTitle}".` },
      { kind: "p", text: "Take a look, then approve it or tell us what still needs work." },
    ],
    button: { label: "Review the changes", url: input.orderUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientOrderApproved(input: {
  firstName: string;
  orderTitle: string;
  orderUrl: string;
  newOrderUrl: string;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: `Approved: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `You've approved "${input.orderTitle}". It's yours to publish.` },
      { kind: "p", text: "You can open the final piece from your orders page at any time." },
    ],
    button: { label: "Open my order", url: input.orderUrl },
    afterButton: [
      { kind: "p", text: "Ready for the next one?" },
      { kind: "link", label: "Send a new brief", url: input.newOrderUrl },
    ],
    settingsUrl: input.settingsUrl,
  };
}

export function clientOrderCancelled(input: {
  firstName: string;
  orderTitle: string;
  amountLabel: string;
  budgetUrl: string;
}): EmailContent {
  return {
    subject: `Order cancelled: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `Your order "${input.orderTitle}" has been cancelled.` },
      ...(input.amountLabel
        ? [
            {
              kind: "p" as const,
              text: `${input.amountLabel} will be returned to your content budget. You can use it on any future order.`,
            },
          ]
        : []),
    ],
    button: { label: "View my budget", url: input.budgetUrl },
    afterButton: [
      {
        kind: "p",
        text: "If you weren't expecting this, reply to this email and we'll look into it.",
      },
    ],
  };
}

export function clientTopUpReceived(input: {
  firstName: string;
  amountLabel: string;
  bonusLabel: string;
  balanceLabel: string;
  budgetUrl: string;
}): EmailContent {
  return {
    subject: `Top-up received: ${input.amountLabel}`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text: input.bonusLabel
          ? `We've added ${input.amountLabel} to your content budget, plus ${input.bonusLabel} of pre-pay credit.`
          : `We've added ${input.amountLabel} to your content budget.`,
      },
      ...(input.balanceLabel
        ? [{ kind: "p" as const, text: `Your balance is now ${input.balanceLabel}.` }]
        : []),
    ],
    button: { label: "View my budget", url: input.budgetUrl },
  };
}

/* Bulk orders and the daily summary */

export type BatchProgress = { total: number; ready: number; approved: number };

function progressLine(progress: BatchProgress) {
  return `${progress.ready} of ${progress.total} drafts ready, ${progress.approved} approved.`;
}

export function clientBatchFirstReady(input: {
  firstName: string;
  orderTitle: string;
  orderUrl: string;
  total: number;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: `The first of your ${input.total} drafts is ready`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text: `The first draft from your bulk order is ready to review: "${input.orderTitle}".`,
      },
      {
        kind: "p",
        text: "It's worth reading this one now. If the tone or direction needs adjusting, it's best to tell us early.",
      },
      {
        kind: "p",
        text: "From here we'll send one summary a day while more drafts arrive, and tell you when they're all done.",
      },
    ],
    button: { label: "Review my draft", url: input.orderUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientBatchAllReady(input: {
  firstName: string;
  total: number;
  waiting: EmailLink[];
  ordersUrl: string;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: `All ${input.total} drafts are ready`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `Every draft from your bulk order of ${input.total} is now written.` },
      ...(input.waiting.length
        ? [
            { kind: "p" as const, text: "Waiting for your review:" },
            { kind: "links" as const, items: input.waiting },
          ]
        : []),
      { kind: "p", text: "Approve each one, or ask for changes and your writer will revise it." },
    ],
    button: { label: "Review my drafts", url: input.ordersUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientDailySummary(input: {
  firstName: string;
  waiting: EmailLink[];
  newCount: number;
  batches: BatchProgress[];
  ordersUrl: string;
  settingsUrl: string;
}): EmailContent {
  const count = input.waiting.length;
  return {
    subject:
      count === 1 ? "1 draft is waiting for your review" : `${count} drafts are waiting for your review`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text:
          input.newCount === 1
            ? "Here's your daily summary. 1 draft has arrived since the last one."
            : `Here's your daily summary. ${input.newCount} drafts have arrived since the last one.`,
      },
      { kind: "p", text: "Waiting for your review:" },
      { kind: "links", items: input.waiting },
      ...input.batches.map((batch) => ({
        kind: "p" as const,
        text: `Bulk order progress: ${progressLine(batch)}`,
      })),
    ],
    button: { label: "Review my drafts", url: input.ordersUrl },
    settingsUrl: input.settingsUrl,
  };
}

export function clientBatchComplete(input: {
  firstName: string;
  approved: number;
  total: number;
  ordersUrl: string;
  newOrderUrl: string;
  settingsUrl: string;
}): EmailContent {
  return {
    subject: "Your bulk order is complete",
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text:
          input.approved === input.total
            ? `You've approved all ${input.total} pieces from your bulk order. They're yours to publish.`
            : `Your bulk order is finished. You approved ${input.approved} of ${input.total} pieces, and they're yours to publish.`,
      },
      { kind: "p", text: "You can open every final piece from your orders page at any time." },
    ],
    button: { label: "Open my orders", url: input.ordersUrl },
    afterButton: [
      { kind: "p", text: "Ready for the next batch?" },
      { kind: "link", label: "Start a new order", url: input.newOrderUrl },
    ],
    settingsUrl: input.settingsUrl,
  };
}

/* ------------------------------------------------------------------ */
/* Writers                                                             */
/* ------------------------------------------------------------------ */

export function writerWelcome(input: { firstName: string; dashboardUrl: string }): EmailContent {
  return {
    subject: "You're set up as a Penned writer",
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: "Your writer account is ready." },
      { kind: "p", text: "Before you take your first order:" },
      {
        kind: "steps",
        items: [
          "Read and accept the writer terms in your settings.",
          "Fill in your profile, so we can match you to the right work.",
          "Open the marketplace to see the orders available to you.",
        ],
      },
    ],
    button: { label: "Go to my dashboard", url: input.dashboardUrl },
  };
}

export function writerOrderClaimed(input: {
  firstName: string;
  order: OrderSummary;
}): EmailContent {
  const { order } = input;
  return {
    subject: `It's yours: ${order.title}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `You've claimed "${order.title}".` },
      {
        kind: "list",
        items: [specLine(order), order.dueLabel ? `Your deadline: ${order.dueLabel}` : ""].filter(
          Boolean,
        ),
      },
      {
        kind: "p",
        text: "Read the full brief before you start. Submit your draft from the order page when it's done.",
      },
    ],
    button: { label: "Open the brief", url: order.url },
  };
}

export function writerSentBackByEditor(input: {
  firstName: string;
  orderTitle: string;
  orderUrl: string;
}): EmailContent {
  return {
    subject: `Your editor has sent back: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text: `Your editor has reviewed "${input.orderTitle}" and it needs some changes before it goes to the client.`,
      },
      {
        kind: "p",
        text: "Please check the comments on the draft, revise it and resubmit as soon as you can, so the client still gets it on time.",
      },
    ],
    button: { label: "Open the order", url: input.orderUrl },
  };
}

export function writerRevisionRequested(input: {
  firstName: string;
  orderTitle: string;
  note: string;
  orderUrl: string;
}): EmailContent {
  return {
    subject: `The client asked for changes: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text: input.note.trim()
          ? `The client has read "${input.orderTitle}" and asked for changes. Here's their note:`
          : `The client has read "${input.orderTitle}" and asked for changes.`,
      },
      ...(input.note.trim() ? [{ kind: "quote" as const, text: input.note }] : []),
      { kind: "p", text: "Please revise and resubmit from the order page." },
    ],
    button: { label: "Open the order", url: input.orderUrl },
  };
}

export function writerOrderApproved(input: {
  firstName: string;
  orderTitle: string;
  earningsUrl: string;
}): EmailContent {
  return {
    subject: `Approved: ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: `The client has approved "${input.orderTitle}". Nice work.` },
      { kind: "p", text: "Your earnings have been updated." },
    ],
    button: { label: "View my earnings", url: input.earningsUrl },
  };
}

export function writerPayoutApproved(input: {
  firstName: string;
  amountLabel: string;
  earningsUrl: string;
}): EmailContent {
  return {
    subject: `Your payout of ${input.amountLabel} is approved`,
    greetingName: input.firstName,
    blocks: [{ kind: "p", text: `We've approved your payout request for ${input.amountLabel}.` }],
    button: { label: "View my earnings", url: input.earningsUrl },
  };
}

export function writerNewComment(input: {
  firstName: string;
  commenterName: string;
  orderTitle: string;
  comment: string;
  orderUrl: string;
}): EmailContent {
  return {
    subject: `New comment on ${input.orderTitle}`,
    greetingName: input.firstName,
    blocks: [
      {
        kind: "p",
        text: `${input.commenterName} left a comment on your draft of "${input.orderTitle}":`,
      },
      { kind: "quote", text: input.comment },
    ],
    button: { label: "Reply on the order page", url: input.orderUrl },
  };
}

/* ------------------------------------------------------------------ */
/* Editors                                                             */
/* ------------------------------------------------------------------ */

export function editorWelcome(input: { firstName: string; dashboardUrl: string }): EmailContent {
  return {
    subject: "You're set up as a Penned editor",
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: "Your editor account is ready." },
      {
        kind: "p",
        text: "Read and accept the editor terms in your settings first. After that, drafts that need editing will appear in your queue, and we'll email you when one arrives.",
      },
    ],
    button: { label: "Go to my dashboard", url: input.dashboardUrl },
  };
}

export function editorDraftReady(input: {
  firstName: string;
  order: OrderSummary;
  writerName: string;
  resubmitted: boolean;
  queueUrl: string;
}): EmailContent {
  const { order } = input;
  if (input.resubmitted) {
    return {
      subject: `Resubmitted: ${order.title}`,
      greetingName: input.firstName,
      blocks: [
        { kind: "p", text: `${input.writerName} has revised "${order.title}" and sent it back to you.` },
        ...(order.dueLabel
          ? [{ kind: "p" as const, text: `Due to the client: ${order.dueLabel}` }]
          : []),
      ],
      button: { label: "Open the queue", url: input.queueUrl },
    };
  }

  return {
    subject: `Ready to edit: ${order.title}`,
    greetingName: input.firstName,
    blocks: [
      { kind: "p", text: "A draft is waiting in the editing queue." },
      {
        kind: "list",
        items: [
          order.title,
          specLine(order),
          order.dueLabel ? `Due to the client: ${order.dueLabel}` : "",
        ].filter(Boolean),
      },
    ],
    button: { label: "Open the queue", url: input.queueUrl },
  };
}

/* ------------------------------------------------------------------ */
/* Team (account managers and admin)                                   */
/* ------------------------------------------------------------------ */

export function teamNewOrders(input: {
  clientName: string;
  clientCompany: string;
  orders: (OrderSummary & { delivery: string })[];
  briefsUrl: string;
}): EmailContent {
  const who = input.clientCompany
    ? `${input.clientName} at ${input.clientCompany}`
    : input.clientName;
  const companyTag = input.clientCompany || input.clientName;

  if (input.orders.length === 1) {
    const order = input.orders[0];
    return {
      subject: `New order to check: ${order.title} (${companyTag})`,
      blocks: [
        { kind: "p", text: `${who} placed an order.` },
        {
          kind: "list",
          items: [
            order.title,
            [specLine(order), order.delivery].filter(Boolean).join(", "),
            order.dueLabel ? `Due to the client: ${order.dueLabel}` : "",
          ].filter(Boolean),
        },
      ],
      button: { label: "Check the brief", url: input.briefsUrl },
    };
  }

  return {
    subject: `New bulk order to check: ${input.orders.length} pieces (${companyTag})`,
    blocks: [
      { kind: "p", text: `${who} placed a bulk order of ${input.orders.length} pieces.` },
      {
        kind: "list",
        items: input.orders.map((order) =>
          [order.title, specLine(order), order.delivery].filter(Boolean).join(", "),
        ),
      },
    ],
    button: { label: "Check the briefs", url: input.briefsUrl },
  };
}

export function teamNewClient(input: {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  answers: string[];
  clientsUrl: string;
}): EmailContent {
  return {
    subject: input.clientCompany
      ? `New client: ${input.clientName}, ${input.clientCompany}`
      : `New client: ${input.clientName}`,
    blocks: [
      {
        kind: "p",
        text: input.clientCompany
          ? `${input.clientName} (${input.clientEmail}) from ${input.clientCompany} created an account.`
          : `${input.clientName} (${input.clientEmail}) created an account.`,
      },
      ...(input.answers.length
        ? [
            { kind: "p" as const, text: "Their answers at sign-up:" },
            { kind: "list" as const, items: input.answers },
          ]
        : []),
    ],
    button: { label: "View clients", url: input.clientsUrl },
  };
}

export function teamRevisionRequested(input: {
  clientName: string;
  clientCompany: string;
  orderTitle: string;
  note: string;
  writerName: string;
  ordersUrl: string;
}): EmailContent {
  const companyTag = input.clientCompany || input.clientName;
  return {
    subject: `Changes requested: ${input.orderTitle} (${companyTag})`,
    blocks: [
      {
        kind: "p",
        text: input.note.trim()
          ? `${input.clientName} asked for changes to "${input.orderTitle}". Their note:`
          : `${input.clientName} asked for changes to "${input.orderTitle}".`,
      },
      ...(input.note.trim() ? [{ kind: "quote" as const, text: input.note }] : []),
      ...(input.writerName
        ? [{ kind: "p" as const, text: `The writer, ${input.writerName}, has been told.` }]
        : []),
    ],
    button: { label: "View orders", url: input.ordersUrl },
  };
}

export function adminPayoutRequested(input: {
  writerName: string;
  amountLabel: string;
  payoutsUrl: string;
}): EmailContent {
  return {
    subject: `Payout requested: ${input.writerName}, ${input.amountLabel}`,
    blocks: [{ kind: "p", text: `${input.writerName} requested a payout of ${input.amountLabel}.` }],
    button: { label: "Review payouts", url: input.payoutsUrl },
  };
}

export function adminTopUpReceived(input: {
  clientName: string;
  clientCompany: string;
  amountLabel: string;
  balanceLabel: string;
  clientsUrl: string;
}): EmailContent {
  const who = input.clientCompany
    ? `${input.clientName} at ${input.clientCompany}`
    : input.clientName;
  return {
    subject: `Top-up: ${input.clientCompany || input.clientName}, ${input.amountLabel}`,
    blocks: [
      {
        kind: "p",
        text: input.balanceLabel
          ? `${who} topped up ${input.amountLabel}. Their balance is now ${input.balanceLabel}.`
          : `${who} topped up ${input.amountLabel}.`,
      },
    ],
    button: { label: "View clients", url: input.clientsUrl },
  };
}
