import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { addSubmissionCommentAction } from "@/app/client/actions";
import { markJobInProgressAction, submitDraftAction } from "@/app/writer/actions";
import { CountdownBadge, Notice, StatusBadge, type NoticeParams } from "@/components/writer-ui";
import { getWriterOrderDetail } from "@/lib/orders";
import { requireRole } from "@/lib/auth";
import { ASSUMED_WORDS_PER_HOUR, formatPayPerHour, formatUsd } from "@/lib/writer-status";

type Params = Promise<{ orderId: string }>;

export default async function WriterOrderDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<NoticeParams>;
}) {
  const user = await requireRole("writer");
  const { orderId } = await params;
  const notice = await searchParams;
  const order = await getWriterOrderDetail(orderId, user.profileId);

  if (!order) {
    notFound();
  }

  return (
    <DashboardShell
      role="writer"
      title={order.title}
      description="Review the brief, submit your draft, and manage revision feedback."
      ctaLabel="Back to my jobs"
      ctaHref="/writer/jobs"
      currentPath="/writer/jobs"
      userName={user.fullName}
    >
      <Notice notice={notice.notice} noticeMessage={notice.noticeMessage} />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Assignment overview"
          description="Everything the writer needs before drafting."
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={order.writerStatus} />
            {["claimed", "revision_requested"].includes(order.dbStatus) ? (
              <CountdownBadge dueDate={order.dueDate} />
            ) : null}
            {order.canStart ? (
              <form action={markJobInProgressAction}>
                <input name="orderId" type="hidden" value={order.id} />
                <button className="button-secondary !px-4 !py-2 !text-sm" type="submit">
                  Start job
                </button>
              </form>
            ) : null}
          </div>
          <dl className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Client" value={order.client} />
            <DetailItem label="Content type" value={order.contentType} />
            <DetailItem label="Status" value={order.status} />
            <DetailItem label="Due date" value={order.deadline} />
            <DetailItem label="Pay" value={order.payCents ? formatUsd(order.payCents) : "TBD"} />
            <DetailItem
              label={`Est. pay / hour (${ASSUMED_WORDS_PER_HOUR} wph)`}
              value={formatPayPerHour(order.payPerHourCents)}
            />
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
          {["accepted", "cancelled"].includes(order.dbStatus) ? (
            <p className="text-sm text-slate-500">
              This job is {order.status.toLowerCase()}, so new drafts can no longer be submitted.
            </p>
          ) : (
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
          )}
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

          <div className="mt-4 rounded-[1.25rem] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attachments</p>
            {order.attachments.length ? (
              <ul className="mt-3 space-y-2">
                {order.attachments.map((attachment) => (
                  <li key={attachment}>
                    <Link
                      className="break-all text-sm font-medium text-blue-700 underline decoration-blue-200 underline-offset-4"
                      href={attachment}
                      target="_blank"
                    >
                      {attachment}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No attachments for this job.</p>
            )}
          </div>

          <div className="mt-4 rounded-[1.25rem] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Style guide{order.styleGuide?.folderName ? ` · ${order.styleGuide.folderName}` : ""}
            </p>
            {order.styleGuide &&
            (order.styleGuide.briefTemplateUrl ||
              order.styleGuide.toneGuide ||
              order.styleGuide.brandNotes ||
              order.styleGuide.complianceNotes ||
              order.styleGuide.targetAudience ||
              order.styleGuide.deliveryPreference) ? (
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {order.styleGuide.briefTemplateUrl ? (
                  <Link
                    className="inline-flex font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                    href={order.styleGuide.briefTemplateUrl}
                    target="_blank"
                  >
                    Open style guide / brief template
                  </Link>
                ) : null}
                <GuideLine label="Tone guide" value={order.styleGuide.toneGuide} />
                <GuideLine label="Brand notes" value={order.styleGuide.brandNotes} />
                <GuideLine label="Target audience" value={order.styleGuide.targetAudience} />
                <GuideLine label="Compliance" value={order.styleGuide.complianceNotes} />
                <GuideLine label="Delivery" value={order.styleGuide.deliveryPreference} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">The client has not attached a style guide to this job.</p>
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

function GuideLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <p>
      <span className="font-semibold text-slate-900">{label}: </span>
      {value}
    </p>
  );
}
