import { readFileSync } from "fs";
import Link from "next/link";
import { AppAuthBar } from "@/components/app-auth-bar";
import { CLIENT_TERMS_UPDATED, CLIENT_TERMS_VERSION, getClientTermsPath } from "@/lib/client-terms";

export default function TermsPage() {
  const body = readFileSync(getClientTermsPath(), "utf8");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-900">
      <AppAuthBar />
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-600">Client terms</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
          Penned Client Terms of Service
        </h1>
        <p className="mt-4 text-base text-slate-500">
          Version {CLIENT_TERMS_VERSION} · Last updated {CLIENT_TERMS_UPDATED}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Lawyer-approved text for business customers. See also our{" "}
          <Link className="font-semibold underline" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
        <article className="mt-10 whitespace-pre-wrap rounded-[2rem] border border-white/80 bg-white/90 p-8 text-[15px] leading-7 text-slate-700 shadow-[0_24px_60px_rgba(25,38,63,0.06)]">
          {body}
        </article>
      </div>
    </main>
  );
}
