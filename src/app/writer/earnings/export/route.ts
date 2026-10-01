import { getCurrentAppUser } from "@/lib/auth";
import { getWriterEarnings } from "@/lib/orders";
import { formatUsd } from "@/lib/writer-status";

export const dynamic = "force-dynamic";

function csvCell(value: string) {
  // Neutralise spreadsheet formula injection from user-controlled titles/client names.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser();

  if (!user || user.role !== "writer") {
    return new Response("Writer access is required.", { status: 401 });
  }

  const earnings = await getWriterEarnings(user.profileId);
  const transactionId = new URL(request.url).searchParams.get("transaction");

  if (transactionId) {
    const row = earnings.rows.find((item) => item.id === transactionId);

    if (!row) {
      return new Response("Transaction not found.", { status: 404 });
    }

    // Placeholder until PDF invoicing is built.
    const body = [
      "PENNED - WRITER PAYMENT STATEMENT (PLACEHOLDER)",
      "================================================",
      `Reference:   ${row.id}`,
      `Date:        ${row.createdAt.slice(0, 10)}`,
      `Writer:      ${user.fullName} <${user.email}>`,
      `Type:        ${row.description}`,
      `Job:         ${row.jobTitle}`,
      `Client:      ${row.client}`,
      `Amount:      ${row.amountCents < 0 ? "-" : ""}${formatUsd(Math.abs(row.amountCents), 2)}`,
      `Status:      ${row.paymentStatus}`,
      "",
      "A formatted PDF invoice is coming soon.",
      "",
    ].join("\n");

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="penned-statement-${row.id.slice(0, 8)}.txt"`,
      },
    });
  }

  const header = ["Date", "Type", "Job", "Client", "Amount (USD)", "Payment status", "Reference"];
  const lines = earnings.rows.map((row) =>
    [
      row.createdAt.slice(0, 10),
      row.description,
      row.jobTitle,
      row.client,
      (row.amountCents / 100).toFixed(2),
      row.paymentStatus,
      row.id,
    ]
      .map((cell, index) => (index === 4 ? cell : csvCell(cell)))
      .join(","),
  );

  return new Response([header.map(csvCell).join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="penned-earnings.csv"',
    },
  });
}
