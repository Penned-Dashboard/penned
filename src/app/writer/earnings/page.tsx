import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { DataTable, EmptyState, MetricCard, Notice, Td, type NoticeParams } from "@/components/writer-ui";
import { requestPayoutAction } from "@/app/writer/actions";
import { requireRole } from "@/lib/auth";
import { getWriterEarnings } from "@/lib/orders";
import { formatUsd } from "@/lib/writer-status";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function WriterEarningsPage({
  searchParams,
}: {
  searchParams: Promise<NoticeParams>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const earnings = await getWriterEarnings(user.profileId);
  const { summary } = earnings;

  return (
    <DashboardShell
      role="writer"
      title="Earnings"
      description="Track what you have earned, what is available, and what has been paid out."
      ctaLabel="Download CSV"
      ctaHref="/writer/earnings/export"
      currentPath="/writer/earnings"
      userName={user.fullName}
      searchAction="/writer/earnings"
    >
      <Notice notice={params.notice} noticeMessage={params.noticeMessage} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lifetime earned" value={formatUsd(summary.lifetimeCents)} hint="All approved work credited to you." />
        <MetricCard label="This month" value={formatUsd(summary.monthCents)} hint="Credited since the 1st." tone="cyan" />
        <MetricCard label="Available" value={formatUsd(summary.availableCents)} hint="Ready to request as a payout." tone="emerald" />
        <MetricCard label="Pending" value={formatUsd(summary.pendingCents)} hint="Payout requests awaiting approval." tone="orange" />
      </section>

      <SectionCard title="Request a payout" description={`You have ${formatUsd(summary.availableCents)} available. Payouts are reviewed manually.`}>
        <form action={requestPayoutAction} className="flex flex-wrap items-center gap-3">
          <input
            className="dashboard-input max-w-40"
            defaultValue={Math.floor(summary.availableCents / 100) || ""}
            min="1"
            name="amount"
            step="1"
            type="number"
          />
          <button className="button-primary" disabled={summary.availableCents <= 0} type="submit">
            Request payout
          </button>
        </form>
        {earnings.payoutRequests.length ? (
          <ul className="mt-5 space-y-2">
            {earnings.payoutRequests.slice(0, 5).map((request) => (
              <li key={request.id} className="dashboard-list-row text-sm">
                <span className="font-medium text-slate-800">{formatUsd(request.amountCents)}</span>
                <span className="text-slate-500">{dateFormat.format(new Date(request.requestedAt))}</span>
                <span className="font-semibold capitalize text-slate-700">{request.status}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Payment history"
        description="Each approved job and payout. Invoices are plain-text stubs until PDF invoicing ships."
      >
        {earnings.rows.length ? (
          <DataTable headers={["Date", "Description", "Job", "Client", "Amount", "Payment", "Invoice"]}>
            {earnings.rows.map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap text-slate-600">{dateFormat.format(new Date(row.createdAt))}</Td>
                <Td className="font-medium text-slate-900">{row.description}</Td>
                <Td>{row.jobTitle}</Td>
                <Td>{row.client}</Td>
                <Td className={`whitespace-nowrap font-semibold ${row.amountCents < 0 ? "text-slate-700" : "text-emerald-600"}`}>
                  {row.amountCents < 0 ? "-" : "+"}
                  {formatUsd(Math.abs(row.amountCents), 2)}
                </Td>
                <Td>
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
                      row.paymentStatus === "Paid" || row.paymentStatus === "Settled"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {row.paymentStatus}
                  </span>
                </Td>
                <Td>
                  <a
                    className="text-sm font-semibold text-blue-700 hover:underline"
                    download
                    href={`/writer/earnings/export?transaction=${row.id}`}
                  >
                    Download
                  </a>
                </Td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState
            title="No earnings yet"
            body="When a client approves your work, the payment shows up here."
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
