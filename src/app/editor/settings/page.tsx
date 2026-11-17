import { acceptEditorTermsAction } from "@/app/editor/actions";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getWriterSettings } from "@/lib/orders";
import {
  WRITER_EDITOR_TERMS_UPDATED,
  WRITER_EDITOR_TERMS_VERSION,
} from "@/lib/writer-editor-terms";

export default async function EditorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; noticeMessage?: string }>;
}) {
  const user = await requireRole("editor");
  const params = await searchParams;
  const settings = await getWriterSettings(user.profileId, {
    fullName: user.fullName,
    email: user.email,
  });

  return (
    <DashboardShell
      role="editor"
      title="Settings"
      description=""
      currentPath="/editor/settings"
      userName={user.fullName}
    >
      {params.noticeMessage ? (
        <div
          className={`rounded-[14px] border px-5 py-4 text-sm font-medium ${
            params.notice === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {params.noticeMessage}
        </div>
      ) : null}

      <SectionCard title="Profile" description="Team-only name and photo. Clients never see editor names.">
        <p className="text-sm text-slate-600">
          {user.fullName} · {user.email}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Launch editor: Junise Lourens (senior for every tier and language). Admins set tiers/languages here later.
        </p>
      </SectionCard>

      <SectionCard
        title="Writer & editor terms"
        description={`Version ${WRITER_EDITOR_TERMS_VERSION} · Updated ${WRITER_EDITOR_TERMS_UPDATED}`}
      >
        {settings.writerTermsAcceptedAt ? (
          <p className="text-sm text-slate-600">
            Accepted {new Date(settings.writerTermsAcceptedAt).toLocaleString("en-GB")}
            {settings.writerTermsVersion ? ` · v${settings.writerTermsVersion}` : ""}.{" "}
            <a className="font-semibold underline" href="/writer-terms" target="_blank" rel="noreferrer">
              Read terms
            </a>
          </p>
        ) : (
          <form action={acceptEditorTermsAction} className="space-y-4">
            <p className="text-sm text-slate-600">
              Please accept the{" "}
              <a className="font-semibold underline" href="/writer-terms" target="_blank" rel="noreferrer">
                Writer and Editor Terms of Service
              </a>{" "}
              before handling paid work.
            </p>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input className="mt-1" name="acceptWriterTerms" required type="checkbox" />
              <span>I have read and agree to the Writer and Editor Terms of Service.</span>
            </label>
            <button className="button-primary" type="submit">
              Accept terms
            </button>
          </form>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
