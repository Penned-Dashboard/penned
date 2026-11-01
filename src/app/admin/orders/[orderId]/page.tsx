import Link from "next/link";
import { notFound } from "next/navigation";
import { refundOrderAction } from "@/app/admin/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { getAdminOrderDetail } from "@/lib/orders";
import { requireRole } from "@/lib/auth";

type Params = Promise<{ orderId: string }>;

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ notice?: string; noticeMessage?: string }>;
}) {
  const user = await requireRole("admin");
  const { orderId } = await params;
  const notice = await searchParams;
  const order = await getAdminOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      role="admin"
      title={order.title}
      description="Admin view of order ownership, lifecycle state, and latest review activity."
      ctaLabel="View all orders"
      ctaHref="/admin/orders"
      currentPath="/admin/orders"
      userName={user.fullName}
    >
      {notice.noticeMessage ? (
        <p
          className={`rounded-[1rem] px-4 py-3 text-sm ${
            notice.notice === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.noticeMessage}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Oversight" description="Operational state for this order.">
          <dl className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Client" value={order.client} />
            <DetailItem label="Writer" value={order.writer} />
            <DetailItem label="Content type" value={order.contentType} />
            <DetailItem label="Status" value={order.status} />
            <DetailItem label="Due date" value={order.deadline} />
            <DetailItem label="Target audience" value={order.targetAudience} />
            <DetailItem label="Tone of voice" value={order.toneOfVoice} />
            <DetailItem label="Target word count" value={order.wordCount} />
            <DetailItem label="Priority" value={order.priority} />
            <DetailItem label="Primary CTA" value={order.primaryCta} />
          </dl>
        </SectionCard>
        <SectionCard title="Refund / cancel" description="Cancel the order and mark it for client credit.">
          <p className="text-sm leading-6 text-slate-600">
            This cancels the order and records a refund note. Full automated wallet credit can come next; for now treat
            the amount as credit owed to the client.
          </p>
          <form action={refundOrderAction} className="mt-4">
            <input name="orderId" type="hidden" value={order.id} />
            <button className="button-secondary" type="submit">
              Cancel & mark refund
            </button>
          </form>
          <Link className="mt-4 inline-block text-sm font-semibold text-[var(--penned-navy)] underline" href="/admin/people">
            Manage client accounts →
          </Link>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Brief" description="Admin reference copy for disputes, reassignment, and QA review.">
          <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-700">{order.brief}</div>
        </SectionCard>
        <SectionCard title="Latest submission" description="Most recent submission state and notes.">
          {order.latestSubmission ? (
            <div className="space-y-3">
              <div className="rounded-[1.25rem] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Version {order.latestSubmission.version} · {order.latestSubmission.status}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{order.latestSubmission.notes}</p>
              </div>
              {order.latestSubmission.comments.map((comment) => (
                <div key={comment.id} className="dashboard-list-row flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{comment.author}</p>
                    <p className="text-xs text-slate-500">{comment.createdAt}</p>
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{comment.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No submission yet.</p>
          )}
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
