import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import { getCurrentAppUser } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; oauth?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();

  if (user) {
    redirect(rolePath(user.role));
  }

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
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white p-8 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center">
            <Link href="/">
              <PennedLogo />
            </Link>
          </div>
          <h1 className="mt-8 text-center text-4xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            Log in
          </h1>
          <p className="mt-3 text-center text-base text-slate-500">
            Welcome back.
          </p>
          <div className="mt-8 grid gap-3">
            <a className="button-secondary w-full text-center" href="/sign-in?oauth=google">
              Continue with Google
            </a>
            <a className="button-secondary w-full text-center" href="/sign-in?oauth=microsoft">
              Continue with Microsoft
            </a>
            {params.oauth ? (
              <p className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Google and Microsoft log-in are coming soon. Use your email and password for now.
              </p>
            ) : null}
          </div>

          <form action={signInAction} className="mt-6 space-y-5">
            <label className="block">
              <span className="dashboard-label">Email</span>
              <input
                className="dashboard-input"
                name="email"
                placeholder="you@youragency.com"
                required
                type="email"
              />
            </label>
            <label className="block">
              <span className="dashboard-label">Password</span>
              <input
                className="dashboard-input"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>
            {params.error ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {params.error === "setup"
                  ? "We can’t log you in right now. Please try again in a few minutes."
                  : params.error === "env"
                    ? "We can’t log you in right now. Please try again in a few minutes."
                    : "That email and password don’t match. Check them and try again."}
              </p>
            ) : null}
            <button className="button-primary w-full" type="submit">
              Log in
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to Penned?{" "}
            <Link className="font-semibold text-[var(--penned-navy)]" href="/sign-up">
              Create your account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">
            Writers: use the log-in link in your invitation email.
          </p>
        </div>
      </div>
    </main>
  );
}
