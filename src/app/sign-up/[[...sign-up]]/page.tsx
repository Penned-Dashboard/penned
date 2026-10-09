import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/(auth)/actions";
import { PennedLogo } from "@/components/penned-logo";
import { RolePicker } from "@/components/role-picker";
import { getCurrentAppUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();
  const defaultRole = params.role === "writer" ? "writer" : "client";

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
            Create your account
          </h1>
          <p className="mt-3 text-center text-lg text-slate-500">
            Choose your role and get started
          </p>

          <form action={signUpAction} className="mt-8 space-y-5">
            <RolePicker defaultRole={defaultRole} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="dashboard-label">First name</span>
                <input className="dashboard-input" name="firstName" placeholder="John" required type="text" />
              </label>
              <label className="block">
                <span className="dashboard-label">Last name</span>
                <input className="dashboard-input" name="lastName" placeholder="Doe" required type="text" />
              </label>
            </div>
            <label className="block">
              <span className="dashboard-label">Email</span>
              <input className="dashboard-input" name="email" placeholder="you@company.com" required type="email" />
            </label>
            <label className="block">
              <span className="dashboard-label">Company or brand</span>
              <input className="dashboard-input" name="companyName" placeholder="Penned Labs" type="text" />
            </label>
            <label className="block">
              <span className="dashboard-label">Password</span>
              <input className="dashboard-input" minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
            </label>
            {params.error ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {params.error === "exists"
                  ? "That email already has an account. Sign in instead."
                  : params.error === "setup"
                    ? "Password auth needs the latest Supabase SQL applied (password_hash column). Run supabase/setup-auth-and-writer-p0.sql, then try again."
                    : params.error === "env"
                      ? "Signup is not configured in this deployment yet. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to this Vercel Preview environment."
                      : params.error === "failed"
                        ? "Account creation failed. Most common causes: missing Supabase env vars on this Vercel preview, or the password_hash column is missing. Run the setup SQL and confirm Preview env vars, then retry."
                  : "Please complete all fields and use a password with at least 8 characters."}
              </p>
            ) : null}
            <button className="button-primary w-full" type="submit">
              Create account
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-[var(--penned-navy)]" href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
