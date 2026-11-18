import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { refundOrderAction } from "@/app/admin/actions";
import { AssignOrderForm } from "@/components/assign-order-form";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { getAdminOrderDetail } from "@/lib/orders";
import { getCurrentAppUser } from "@/lib/auth";
import { getTeamEditors, getTeamWriters, WRITER_ASSIGNABLE } from "@/lib/team-data";
import { rolePath } from "@/lib/types";

type Params = Promise<{ orderId: string }>;

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ notice?: string; noticeMessage?: string }>;
}) {
  const user = await getCurrentAppUser();
  if (!user || (user.role !== "admin" && user.role !== "account_manager")) {
    redirect("/sign-in");
  }
  const { orderId } = await params;
  const notice = await searchParams;
  const [order, writers, editors] = await Promise.all([
    getAdminOrderDetail(orderId),
    getTeamWriters(),
    getTeamEditors(),
  ]);

  if (!order) {
    notFound();
  }
  const finished = order.workflowStatus === "completed" || order.workflowStatus === "cancelled";
  const isAdmin = user.role === "admin";
  const ordersHref = isAdmin ? "/admin/orders" : `${rolePath("account_manager")}/orders`;

  return (
    <DashboardShell
      role={user.role}
      title={order.title}
      description="Order ownership, writer assignment, and latest review activity."
      ctaLabel="View all orders"
      ctaHref={ordersHref}
      currentPath={ordersHref}
      userName={user.fullName}
    >
      {notice.noticeMessage ? (
        <p
          className={`rounded-[14px] px-4 py-3 text-sm ${
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
        {isAdmin ? (
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
        ) : (
          <SectionCard title="Account manager" description="">
            <p className="text-sm text-slate-600">
              Assign the writer below once the brief is accepted. Use Briefs to check to accept new briefs first.
            </p>
          </SectionCard>
        )}
      </section>

      <SectionCard
        title="Writer and editor"
        description="Assign a writer once the brief is accepted. They get an email straight away."
      >
        {order.preferredWriter ? (
          <p className="mb-3 text-sm text-slate-600">Client prefers: {order.preferredWriter}</p>
        ) : null}
        {finished ? (
          <p className="text-sm text-slate-500">This order is finished.</p>
        ) : (
          <AssignOrderForm
            canAssignWriter={WRITER_ASSIGNABLE.includes(order.workflowStatus)}
            currentEditorId={order.editorId}
            currentWriterId={order.writerId}
            editors={editors}
            orderId={order.id}
            returnTo={`/admin/orders/${order.id}`}
            writerHint="Accept the brief first, so the delivery clock starts."
            writers={writers}
          />
        )}
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Brief" description="Admin reference copy for disputes, reassignment, and QA review.">
          <div className="rounded-[14px] bg-white p-5 text-sm leading-7 text-slate-700">{order.brief}</div>
        </SectionCard>
        <SectionCard title="Latest submission" description="Most recent submission state and notes.">
          {order.latestSubmission ? (
            <div className="space-y-3">
              <div className="rounded-[14px] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Version {order.latestSubmission.version} · {order.latestSubmission.status}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{order.latestSubmission.notes}</p>
              </div>
              {order.latestSubmission.comments.map((comment) => (
                <div key={comment.id} className="dashboard-list-row flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--penned-navy)]">{comment.author}</p>
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
    <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--penned-navy)]">{value}</p>
    </div>
  );
}
