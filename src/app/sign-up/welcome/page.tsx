import Link from "next/link";
import { PennedLogo } from "@/components/penned-logo";
import { getCurrentAppUser } from "@/lib/auth";

export default async function SignUpWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();
  const firstName =
    params.name?.trim() ||
    user?.fullName.split(" ")[0] ||
    "there";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--penned-navy)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "url(/brand/penned-pattern-navy.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
        <div className="w-full rounded-[2rem] border border-white/15 bg-white p-8 text-center shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center">
            <PennedLogo />
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            You’re in, {firstName}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Your account is ready. Send your first brief, or explore the dashboard first.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link className="button-primary" href="/client/new-order">
              Send my first brief
            </Link>
            <Link className="button-secondary" href="/client">
              Go to my dashboard
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            You’ll add your payment when you place your first order.
          </p>
        </div>
      </div>
    </main>
  );
}
