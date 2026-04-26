import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import {
  acceptSubmissionAction,
  addSubmissionCommentAction,
  requestRevisionAction,
} from "@/app/client/actions";
import { getClientOrderDetail } from "@/lib/orders";
import { requireRole } from "@/lib/auth";

type Params = Promise<{ orderId: string }>;

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireRole("client");
  const { orderId } = await params;
  const order = await getClientOrderDetail(orderId, user.profileId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      role="client"
      title={order.title}
      description="Order detail view for tracking brief quality, ownership, and delivery state."
      ctaLabel="Back to client dashboard"
      ctaHref="/client"
      currentPath="/client"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Order overview"
          description="This is the persisted brief and current lifecycle state."
        >
          <dl className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Status" value={order.status} />
            <DetailItem label="Content type" value={order.contentType} />
            <DetailItem label="Due date" value={order.deadline} />
            <DetailItem label="Writer" value={order.writer} />
            <DetailItem label="Target audience" value={order.targetAudience} />
            <DetailItem label="Tone of voice" value={order.toneOfVoice} />
            <DetailItem label="Target word count" value={order.wordCount} />
            <DetailItem label="Priority" value={order.priority} />
            <DetailItem label="Primary CTA" value={order.primaryCta} />
          </dl>
        </SectionCard>

        <SectionCard
          title="References"
          description="Source links and supporting notes attached to the brief."
        >
          <div className="space-y-3">
            {order.referenceLinks.length ? (
              order.referenceLinks.map((link) => (
                <div key={link} className="dashboard-list-row">
                  <Link
                    className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4"
                    href={link.startsWith("http") ? link : "#"}
                    target={link.startsWith("http") ? "_blank" : undefined}
                  >
                    {link}
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No references attached.</p>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Latest submission"
          description="Review the newest version, open the draft, and move the order forward."
        >
          {order.latestSubmission ? (
            <div className="space-y-4">
              <div className="rounded-[1.25rem] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Version {order.latestSubmission.version} · {order.latestSubmission.status}
                  </p>
                  <p className="text-xs text-slate-500">{order.latestSubmission.submittedAt}</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {order.latestSubmission.notes}
                </p>
                {order.latestSubmission.googleDocUrl ? (
                  <Link
                    className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                    href={order.latestSubmission.googleDocUrl}
                    target="_blank"
                  >
                    Open Google Doc
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={acceptSubmissionAction}>
                  <input name="orderId" type="hidden" value={order.id} />
                  <input
                    name="submissionId"
                    type="hidden"
                    value={order.latestSubmission.id}
                  />
                  <button className="button-primary" type="submit">
                    Accept submission
                  </button>
                </form>
                <form action={requestRevisionAction} className="flex flex-1 flex-col gap-3">
                  <input name="orderId" type="hidden" value={order.id} />
                  <input
                    name="submissionId"
                    type="hidden"
                    value={order.latestSubmission.id}
                  />
                  <textarea
                    className="dashboard-input min-h-24"
                    name="feedback"
                    placeholder="Request changes, add direction, or note missing points."
                    required
                  />
                  <button className="button-secondary self-start" type="submit">
                    Request revision
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No writer submission has been created for this order yet.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Review thread"
          description="Keep revision feedback and clarifications attached to the submission."
        >
          {order.latestSubmission ? (
            <div className="space-y-4">
              <div className="space-y-3">
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
              <form action={addSubmissionCommentAction} className="space-y-3">
                <input
                  name="submissionId"
                  type="hidden"
                  value={order.latestSubmission.id}
                />
                <textarea
                  className="dashboard-input min-h-24"
                  name="body"
                  placeholder="Add a comment for the writer or editor."
                  required
                />
                <button className="button-secondary" type="submit">
                  Add comment
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No review thread yet.</p>
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Brief"
        description="Long-form brief details that the writer and editor will work from."
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
