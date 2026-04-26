import { notFound } from "next/navigation";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { getAdminOrderDetail } from "@/lib/orders";
import { requireRole } from "@/lib/auth";

type Params = Promise<{ orderId: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireRole("admin");
  const { orderId } = await params;
  const order = await getAdminOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      role="admin"
      title={order.title}
      description="Admin view of order ownership, lifecycle state, and latest review activity."
      ctaLabel="Back to admin dashboard"
      ctaHref="/admin"
      currentPath="/admin"
      userName={user.fullName}
    >
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
        <SectionCard
          title="Latest submission"
          description="Most recent submission state and notes."
        >
          {order.latestSubmission ? (
            <div className="space-y-3">
              <div className="rounded-[1.25rem] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Version {order.latestSubmission.version} · {order.latestSubmission.status}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {order.latestSubmission.notes}
                </p>
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

      <SectionCard
        title="Brief"
        description="Admin reference copy for disputes, reassignment, and QA review."
      >
        <div className="space-y-4">
          <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-700">
            {order.brief}
          </div>
          <div className="rounded-[1.25rem] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Target keywords
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {order.targetKeywords.length ? (
                order.targetKeywords.map((keyword) => (
                  <span key={keyword} className="dashboard-pill">
                    {keyword}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No keywords attached.</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-4">
      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
