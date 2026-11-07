import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { WriterPrivacyCard } from "@/components/writer-privacy-card";
import { firstNameOnly, redactContactDetails } from "@/lib/writer-privacy";
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
    return (
      <DashboardShell
        role="client"
        title="This order isn't available"
        description=""
        ctaLabel="← Orders"
        ctaHref="/client/orders"
        currentPath="/client/orders"
        userName={user.fullName}
      >
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm leading-7 text-slate-600">
          <p>You don’t have access to this order, or it no longer exists.</p>
          <Link className="button-primary mt-6 inline-flex" href="/client/orders">
            Back to Orders
          </Link>
        </section>
      </DashboardShell>
    );
  }

  const isAccepted = ["Accepted", "Approved", "Completed"].includes(order.status);
  const inReview =
    ["In Review", "Submitted", "Revision Requested"].includes(order.status) ||
    Boolean(order.latestSubmission && !isAccepted);
  const writerFirst = firstNameOnly(order.writer);
  const deliveryLabel =
    order.priority?.toLowerCase() === "rush"
      ? "Rush"
      : order.priority?.toLowerCase() === "priority"
        ? "Priority"
        : "Standard";
  const canReviewLatest =
    Boolean(order.latestSubmission) &&
    !isAccepted &&
    !["Accepted", "Approved"].includes(order.latestSubmission?.status ?? "");
  const versions = order.latestSubmission
    ? [
        {
          id: order.latestSubmission.id,
          label: `v${order.latestSubmission.version}`,
          status: order.latestSubmission.status,
          date: order.latestSubmission.submittedAt,
          notes: order.latestSubmission.notes,
          googleDocUrl: order.latestSubmission.googleDocUrl,
        },
      ]
    : [];

  return (
    <DashboardShell
      role="client"
      title={order.title}
      description=""
      ctaLabel="← Orders"
      ctaHref="/client/orders"
      currentPath="/client/orders"
      userName={user.fullName}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="dashboard-pill">{order.status}</span>
        <span>{order.contentType}</span>
        <span>·</span>
        <span>{order.serviceTier ? formatTier(order.serviceTier) : "Standard"}</span>
        <span>·</span>
        <span>Due {order.deadline}</span>
        <span>·</span>
        <span>{order.wordCount} words</span>
        <span>·</span>
        <span>{writerFirst}</span>
        <span>·</span>
        <span>{deliveryLabel}</span>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        {inReview && order.latestSubmission ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-700">
              Draft {order.latestSubmission.version} is ready for your review
            </p>
            <div className="flex flex-wrap gap-3">
              {order.latestSubmission.googleDocUrl ? (
                <Link
                  className="button-secondary"
                  href={order.latestSubmission.googleDocUrl}
                  target="_blank"
                >
                  Open draft ↗
                </Link>
              ) : null}
              {canReviewLatest ? (
                <>
                  <form action={acceptSubmissionAction}>
                    <input name="orderId" type="hidden" value={order.id} />
                    <input name="submissionId" type="hidden" value={order.latestSubmission.id} />
                    <button className="button-primary" type="submit">
                      Approve
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        ) : isAccepted ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-700">Approved and ready to download</p>
            <div className="flex flex-wrap gap-3">
              {order.latestSubmission?.googleDocUrl ? (
                <Link className="button-primary" href={order.latestSubmission.googleDocUrl} target="_blank">
                  Download ↗
                </Link>
              ) : null}
              <Link className="button-secondary" href="/client/new-order">
                Order something similar
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-700">
            Being written · Due {order.deadline}
          </p>
        )}
      </section>

      {order.latestSubmission ? (
        <WriterPrivacyCard firstName={writerFirst} />
      ) : null}

      <SectionCard title="Conversation" description="Drafts, comments and change requests in one place.">
        {order.latestSubmission ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Version {order.latestSubmission.version} · {order.latestSubmission.status}
                </p>
                <p className="text-xs text-slate-500">{order.latestSubmission.submittedAt}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                {redactContactDetails(order.latestSubmission.notes || "")}
              </p>
              {order.latestSubmission.googleDocUrl ? (
                <Link
                  className="button-secondary mt-4 inline-flex"
                  href={order.latestSubmission.googleDocUrl}
                  target="_blank"
                >
                  Open Google Doc ↗
                </Link>
              ) : null}
              {/signature|specialist|rank/i.test(String(order.serviceTier ?? "")) ? (
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-slate-900">Download AI-detection report</span>
                  <span className="text-slate-500"> · included on Signature and Specialist</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {order.latestSubmission.comments.map((comment) => (
                <div key={comment.id} className="dashboard-list-row flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{firstNameOnly(comment.author)}</p>
                    <p className="text-xs text-slate-500">{comment.createdAt}</p>
                  </div>
                  <p className="text-sm leading-7 text-slate-700">
                    {redactContactDetails(comment.body)}
                  </p>
                </div>
              ))}
            </div>

            {canReviewLatest ? (
              <form action={requestRevisionAction} className="space-y-3">
                <input name="orderId" type="hidden" value={order.id} />
                <input name="submissionId" type="hidden" value={order.latestSubmission.id} />
                <textarea
                  className="dashboard-input min-h-24"
                  name="feedback"
                  placeholder="What should change? Be as specific as you can."
                  required
                />
                <button className="button-secondary" type="submit">
                  Request changes
                </button>
              </form>
            ) : (
              <form action={addSubmissionCommentAction} className="space-y-3">
                <input name="submissionId" type="hidden" value={order.latestSubmission.id} />
                <textarea
                  className="dashboard-input min-h-24"
                  name="body"
                  placeholder="Add a note for the writer."
                  required
                />
                <button className="button-secondary" type="submit">
                  Add comment
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No drafts yet. Conversation starts when the first draft lands.</p>
        )}
      </SectionCard>

      <SectionCard title="Version history" description="Every delivered draft, newest first.">
        {versions.length ? (
          <div className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="dashboard-list-row">
                <div>
                  <p className="font-semibold text-slate-950">
                    {version.label} · {version.status}
                  </p>
                  <p className="text-sm text-slate-500">{version.date}</p>
                </div>
                {version.googleDocUrl ? (
                  <Link className="text-sm font-semibold underline" href={version.googleDocUrl} target="_blank">
                    Open ↗
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No versions yet.</p>
        )}
      </SectionCard>

      <details className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <summary className="cursor-pointer list-none text-lg font-semibold text-slate-950">
          Show full brief
        </summary>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <DetailItem label="Client" value={order.clientLabel} />
          <DetailItem label="Tone of voice" value={order.toneOfVoice} />
          <DetailItem label="Target audience" value={order.targetAudience} />
          <DetailItem label="Primary CTA" value={order.primaryCta} />
        </dl>
        <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          {order.brief || "No long-form brief notes."}
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Target keywords</p>
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
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">References</p>
          <div className="mt-3 space-y-2">
            {order.referenceLinks.length ? (
              order.referenceLinks.map((link) => (
                <Link
                  key={link}
                  className="block text-sm font-medium text-slate-700 underline"
                  href={link.startsWith("http") ? link : "#"}
                  target={link.startsWith("http") ? "_blank" : undefined}
                >
                  {link}
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No references attached.</p>
            )}
          </div>
        </div>
      </details>
    </DashboardShell>
  );
}

function formatTier(value: string) {
  if (value === "rank" || value === "specialist") return "Specialist";
  if (value === "signature") return "Signature";
  return "Standard";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-50 p-4">
      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-900">{value || "Not set"}</dd>
    </div>
  );
}
