import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { addSubmissionCommentAction } from "@/app/client/actions";
import { submitDraftAction } from "@/app/writer/actions";
import { getWriterOrderDetail } from "@/lib/orders";
import { requireRole } from "@/lib/auth";

type Params = Promise<{ orderId: string }>;

export default async function WriterOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireRole("writer");
  const { orderId } = await params;
  const order = await getWriterOrderDetail(orderId, user.profileId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      role="writer"
      title={order.title}
      description="Review the brief, submit your draft, and manage revision feedback."
      ctaLabel="Back to writer dashboard"
      ctaHref="/writer"
      currentPath="/writer"
      userName={user.fullName}
    >
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Assignment overview"
          description="Everything the writer needs before drafting."
        >
          <dl className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Client" value={order.client} />
            <DetailItem label="Content type" value={order.contentType} />
            <DetailItem label="Status" value={order.status} />
            <DetailItem label="Due date" value={order.deadline} />
            <DetailItem label="Tone of voice" value={order.toneOfVoice} />
            <DetailItem label="Target word count" value={order.wordCount} />
            <DetailItem label="Priority" value={order.priority} />
            <DetailItem label="Primary CTA" value={order.primaryCta} />
          </dl>
        </SectionCard>

        <SectionCard
          title="Submission"
          description="Submit a Google Doc and a short handoff note for review."
        >
          <form action={submitDraftAction} className="space-y-4">
            <input name="orderId" type="hidden" value={order.id} />
            <label>
              <span className="dashboard-label">Google Doc URL</span>
              <input
                className="dashboard-input"
                name="googleDocUrl"
                placeholder="https://docs.google.com/..."
                required
                type="url"
              />
            </label>
            <label>
              <span className="dashboard-label">Submission notes</span>
              <textarea
                className="dashboard-input min-h-28"
                name="notes"
                placeholder="What changed, what still needs review, and anything the client should focus on."
                required
              />
            </label>
            <button className="button-primary" type="submit">
              Submit draft
            </button>
          </form>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Brief"
          description="Use this as the working source of truth for the assignment."
        >
          <div className="rounded-[1.25rem] bg-white p-5 text-sm leading-7 text-slate-700">
            {order.brief}
          </div>
          <div className="mt-4 rounded-[1.25rem] bg-white p-5">
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
          <div className="mt-4 space-y-3">
            {order.referenceLinks.length ? (
              order.referenceLinks.map((link) => (
                <Link
                  key={link}
                  className="dashboard-list-row text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4"
                  href={link}
                  target="_blank"
                >
                  {link}
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No references attached.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest review thread"
          description="Client and editor feedback on the most recent version."
        >
          {order.latestSubmission ? (
            <div className="space-y-4">
              <div className="rounded-[1.25rem] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Version {order.latestSubmission.version} · {order.latestSubmission.status}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
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
                  placeholder="Reply to feedback or leave a note for the client."
                  required
                />
                <button className="button-secondary" type="submit">
                  Add comment
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No submission has been created for this assignment yet.
            </p>
          )}
        </SectionCard>
      </section>
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
