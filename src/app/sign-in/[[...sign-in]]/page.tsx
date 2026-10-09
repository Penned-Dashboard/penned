import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import { getCurrentAppUser } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();

  if (user) {
    redirect(`/${user.role}`);
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_20%_15%,rgba(221,244,121,0.35),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(145,185,210,0.28),transparent_26%),linear-gradient(180deg,#f4f7fb_0%,#e8eef5_100%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-[0_30px_70px_rgba(23,37,63,0.08)]">
          <div className="flex justify-center">
            <Link href="/">
              <PennedLogo />
            </Link>
          </div>
          <h1 className="mt-8 text-center text-4xl font-semibold tracking-[-0.05em] text-[var(--penned-navy)]">
            Sign in
          </h1>
          <p className="mt-3 text-center text-lg text-slate-500">
            Access your client, writer, or admin workspace
          </p>
          <form action={signInAction} className="mt-8 space-y-5">
            <label className="block">
              <span className="dashboard-label">Email</span>
              <input
                className="dashboard-input"
                name="email"
                placeholder="you@company.com"
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
                placeholder="Your password"
                required
                type="password"
              />
            </label>
            {params.error ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {params.error === "setup"
                  ? "Password sign-in is not ready yet. Run supabase/setup-auth-and-writer-p0.sql in Supabase first."
                  : params.error === "env"
                    ? "Sign-in is not configured in this deployment yet. Add the Supabase server env vars to this Vercel environment."
                    : "Incorrect email or password."}
              </p>
            ) : null}
            <button className="button-primary w-full" type="submit">
              Enter workspace
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to Penned?{" "}
            <Link className="font-semibold text-[var(--penned-navy)]" href="/sign-up">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
