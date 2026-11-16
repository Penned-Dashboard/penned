/**
 * One sample of every notification email, filled with made-up data, so the
 * whole set can be reviewed in a real inbox. Used only by the preview-only
 * route /api/email-samples. Nothing here reads or writes the database.
 */

import * as t from "@/lib/email-templates";
import type { EmailContent, OrderSummary } from "@/lib/email-templates";

export type EmailSample = { audience: string; content: EmailContent };

const APP = "https://app.penned.io";

function order(title: string, extra: Partial<OrderSummary> = {}): OrderSummary {
  return {
    title,
    contentType: "Blog Post",
    wordCount: 1500,
    language: "English (UK)",
    dueLabel: "Thu 19 Nov, 16:00 UK time",
    costLabel: "$108.00",
    url: `${APP}/client/orders/sample`,
    ...extra,
  };
}

export function buildEmailSamples(): EmailSample[] {
  const settingsUrl = `${APP}/client/settings`;
  const ordersUrl = `${APP}/client/orders`;
  const newOrderUrl = `${APP}/client/new-order`;
  const budgetUrl = `${APP}/client/content-budget`;
  const orderUrl = `${APP}/client/orders/sample`;
  const writerOrderUrl = `${APP}/writer/orders/sample`;
  const batch = [
    order("What is AEO?"),
    order("SEO for SaaS start-ups"),
    order("Digital PR checklist"),
    order("Writing for answer engines"),
  ];

  return [
    // Clients
    { audience: "Client", content: t.clientWelcome({ firstName: "Cara", newOrderUrl }) },
    {
      audience: "Client",
      content: t.clientOrderReceived({
        firstName: "Cara",
        order: order("How to plan a content calendar", { dueLabel: "" }),
        settingsUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientBatchReceived({
        firstName: "Cara",
        orders: batch,
        totalCostLabel: "$432.00",
        ordersUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client",
      content: t.clientDraftReady({
        firstName: "Cara",
        orderTitle: "How to plan a content calendar",
        orderUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client",
      content: t.clientRevisedDraftReady({
        firstName: "Cara",
        orderTitle: "How to plan a content calendar",
        orderUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client",
      content: t.clientOrderCancelled({
        firstName: "Cara",
        orderTitle: "How to plan a content calendar",
        amountLabel: "$108.00",
        budgetUrl,
      }),
    },
    {
      audience: "Client",
      content: t.clientTopUpReceived({
        firstName: "Cara",
        amountLabel: "$500.00",
        bonusLabel: "$25.00",
        balanceLabel: "$525.00",
        budgetUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientBatchFirstReady({
        firstName: "Cara",
        orderTitle: "What is AEO?",
        orderUrl,
        total: 4,
        settingsUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientDailySummary({
        firstName: "Cara",
        waiting: [
          { label: "SEO for SaaS start-ups", url: orderUrl },
          { label: "Digital PR checklist", url: orderUrl },
        ],
        newCount: 2,
        batches: [{ total: 4, ready: 3, approved: 1 }],
        ordersUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientBatchAllReady({
        firstName: "Cara",
        total: 4,
        waiting: [
          { label: "SEO for SaaS start-ups", url: orderUrl },
          { label: "Writing for answer engines", url: orderUrl },
        ],
        ordersUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientBatchComplete({
        firstName: "Cara",
        approved: 4,
        total: 4,
        ordersUrl,
        newOrderUrl,
        settingsUrl,
      }),
    },

    // Writers
    { audience: "Writer", content: t.writerWelcome({ firstName: "Will", dashboardUrl: `${APP}/writer` }) },
    {
      audience: "Writer",
      content: t.writerOrderClaimed({
        firstName: "Will",
        order: order("How to plan a content calendar", {
          dueLabel: "Thu 19 Nov, 10:00 UK time",
          url: writerOrderUrl,
        }),
      }),
    },
    {
      audience: "Writer",
      content: t.writerSentBackByEditor({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        orderUrl: writerOrderUrl,
        fixByLabel: "Thu 19 Nov, 14:00 UK time",
      }),
    },
    {
      audience: "Writer",
      content: t.writerRevisionRequested({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        note: "Could the intro be shorter, and add one UK example in section 2?",
        orderUrl: writerOrderUrl,
        fixByLabel: "Fri 20 Nov, 17:00 UK time",
      }),
    },
    {
      audience: "Writer",
      content: t.writerOrderApproved({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        earningsUrl: `${APP}/writer/earnings`,
      }),
    },
    {
      audience: "Writer",
      content: t.writerPayoutApproved({
        firstName: "Will",
        amountLabel: "$120.00",
        earningsUrl: `${APP}/writer/earnings`,
      }),
    },
    {
      audience: "Writer",
      content: t.writerNewComment({
        firstName: "Will",
        commenterName: "The client",
        orderTitle: "How to plan a content calendar",
        comment: "Love this. Could we add a stat in the second paragraph?",
        orderUrl: writerOrderUrl,
      }),
    },

    // Editors
    { audience: "Editor", content: t.editorWelcome({ firstName: "Edie", dashboardUrl: `${APP}/editor` }) },
    {
      audience: "Editor",
      content: t.editorDraftReady({
        firstName: "Edie",
        order: order("How to plan a content calendar"),
        writerName: "Will Writer",
        resubmitted: false,
        queueUrl: `${APP}/editor`,
      }),
    },
    {
      audience: "Editor",
      content: t.editorDraftReady({
        firstName: "Edie",
        order: order("How to plan a content calendar"),
        writerName: "Will Writer",
        resubmitted: true,
        queueUrl: `${APP}/editor`,
      }),
    },

    // Account managers and admin
    {
      audience: "Account manager",
      content: t.teamNewOrders({
        clientName: "Cara Client",
        clientCompany: "Acme Agency",
        orders: [{ ...order("How to plan a content calendar"), delivery: "standard delivery" }],
        briefsUrl: `${APP}/account-manager/briefs`,
      }),
    },
    {
      audience: "Account manager (bulk)",
      content: t.teamNewOrders({
        clientName: "Cara Client",
        clientCompany: "Acme Agency",
        orders: batch.map((item) => ({ ...item, delivery: "standard delivery" })),
        briefsUrl: `${APP}/account-manager/briefs`,
      }),
    },
    {
      audience: "Account manager",
      content: t.teamRevisionRequested({
        clientName: "Cara Client",
        clientCompany: "Acme Agency",
        orderTitle: "How to plan a content calendar",
        note: "Could the intro be shorter, and add one UK example in section 2?",
        writerName: "Will Writer",
        ordersUrl: `${APP}/account-manager/orders`,
      }),
    },
    {
      audience: "Admin and account managers",
      content: t.teamNewClient({
        clientName: "Cara Client",
        clientEmail: "cara@example.com",
        clientCompany: "Acme Agency",
        answers: ["Needs: Blog posts, SEO content", "Industries: SaaS", "Content comes from: Freelancers"],
        clientsUrl: `${APP}/admin/clients`,
      }),
    },
    // Deadline emails and summaries (added 16 Nov)
    {
      audience: "Client",
      content: t.clientBriefAccepted({
        firstName: "Cara",
        orderTitle: "How to plan a content calendar",
        dueLabel: "Thu 19 Nov, 16:00 UK time",
        orderUrl,
        settingsUrl,
      }),
    },
    {
      audience: "Client (bulk)",
      content: t.clientBatchAccepted({ firstName: "Cara", total: 4, ordersUrl, settingsUrl }),
    },
    {
      audience: "Writer",
      content: t.writerDeadlineReminder({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        dueLabel: "Thu 19 Nov, 10:00 UK time",
        hoursLeft: 12,
        isRevision: false,
        orderUrl: writerOrderUrl,
      }),
    },
    {
      audience: "Writer",
      content: t.writerDeadlineReminder({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        dueLabel: "Thu 19 Nov, 10:00 UK time",
        hoursLeft: 2,
        isRevision: false,
        orderUrl: writerOrderUrl,
      }),
    },
    {
      audience: "Writer",
      content: t.writerOverdue({
        firstName: "Will",
        orderTitle: "How to plan a content calendar",
        dueLabel: "Thu 19 Nov, 10:00 UK time",
        orderUrl: writerOrderUrl,
      }),
    },
    {
      audience: "Editor",
      content: t.editorDraftWaiting({
        firstName: "Edie",
        orderTitle: "How to plan a content calendar",
        waitingHours: 2,
        clientDueLabel: "Thu 19 Nov, 16:00 UK time",
        queueUrl: `${APP}/editor`,
      }),
    },
    ...[
      ["Brief waiting 4 hours: How to plan a content calendar", "\"How to plan a content calendar\" was ordered 4 hours ago and its brief hasn't been checked. The delivery clock only starts once it's accepted."],
      ["No writer yet: How to plan a content calendar", "\"How to plan a content calendar\" was accepted 6 hours ago and no writer has claimed it."],
      ["Writer missed their deadline: How to plan a content calendar", "Will Writer hasn't submitted \"How to plan a content calendar\", which was due by Thu 19 Nov, 10:00 UK time."],
      ["At risk: How to plan a content calendar", "\"How to plan a content calendar\" is due to the client by Thu 19 Nov, 16:00 UK time and nothing has been delivered yet. If it may be late, tell the client now and give them a new delivery time (client terms 6.4)."],
      ["Draft waiting 4 hours for an editor: How to plan a content calendar", "\"How to plan a content calendar\" has been in the editing queue for 4 hours. The editing window is closing."],
    ].map(([subject, lead]) => ({
      audience: "Account manager",
      content: t.teamAlert({
        subject,
        lead,
        details: ["Due to the client: Thu 19 Nov, 16:00 UK time"],
        button: { label: "Open the order", url: `${APP}/account-manager/orders` },
      }),
    })),
    {
      audience: "Account managers and admin",
      content: t.teamAlert({
        subject: "Client deadline missed: How to plan a content calendar",
        lead: "\"How to plan a content calendar\" was due to the client by Thu 19 Nov, 16:00 UK time and hasn't been delivered. A 25% credit is owed if it's late for a reason within our control (client terms 6.4).",
        details: ["Due to the client: Thu 19 Nov, 16:00 UK time"],
        button: { label: "Open the order", url: `${APP}/admin/orders` },
      }),
    },
    {
      audience: "Account manager",
      content: t.teamMorningSummary({
        audience: "account managers",
        dateLabel: "Tue 17 Nov",
        sections: [
          {
            heading: "Due to clients in the next 24 hours, not delivered yet",
            items: [{ label: "How to plan a content calendar (Tue 17 Nov, 16:00 UK time)", url: `${APP}/account-manager/orders` }],
          },
          { heading: "Writers past their deadline", items: [] },
          {
            heading: "Accepted, no writer yet",
            items: [{ label: "SEO for SaaS start-ups", url: `${APP}/account-manager/orders` }],
          },
          {
            heading: "Briefs to check",
            items: [
              { label: "Digital PR checklist", url: `${APP}/account-manager/briefs` },
              { label: "Writing for answer engines", url: `${APP}/account-manager/briefs` },
            ],
          },
          {
            heading: "New clients in the last 24 hours",
            items: [{ label: "Cara Client, Acme Agency, cara@example.com", url: `${APP}/account-manager/clients` }],
          },
        ],
        button: { label: "Open orders", url: `${APP}/account-manager/orders` },
      }),
    },
    {
      audience: "Admin",
      content: t.teamMorningSummary({
        audience: "admin",
        dateLabel: "Tue 17 Nov",
        sections: [
          { heading: "Late to clients (credit may be owed)", items: [] },
          { heading: "Payout requests waiting", items: [{ label: "Will Writer: $120.00", url: `${APP}/admin/payouts` }] },
          { heading: "Top-ups in the last 24 hours", items: [{ label: "Acme Agency: $500.00", url: `${APP}/admin/clients` }] },
          {
            heading: "New clients in the last 24 hours",
            items: [{ label: "Cara Client, Acme Agency, cara@example.com", url: `${APP}/admin/clients` }],
          },
        ],
        button: { label: "Open admin", url: `${APP}/admin/orders` },
      }),
    },
  ];
}
