import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7f9fd]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_15%_20%,rgba(255,210,182,0.35),transparent_18%),radial-gradient(circle_at_75%_18%,rgba(131,216,255,0.22),transparent_24%),radial-gradient(circle_at_85%_40%,rgba(81,187,176,0.14),transparent_20%),linear-gradient(180deg,#f6f8fc_0%,#eef3f8_100%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_30px_70px_rgba(25,38,63,0.08)]">
          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] text-sm font-semibold text-white">
                P
              </span>
              <span className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Penned
              </span>
            </Link>
          </div>
          <h1 className="mt-8 text-center text-4xl font-semibold tracking-[-0.05em] text-slate-950">
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
              <p className="text-sm text-rose-600">
                {params.error === "setup"
                  ? "Password sign-in is not ready yet. Run the latest Supabase upgrade SQL first."
                  : params.error === "env"
                    ? "Signin is not configured in this deployment yet. Add the Supabase server env vars to this Vercel environment."
                  : "Incorrect email or password."}
              </p>
            ) : null}
            <button className="button-primary w-full" type="submit">
              Enter workspace
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to Penned?{" "}
            <Link className="font-semibold text-slate-900" href="/sign-up">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
