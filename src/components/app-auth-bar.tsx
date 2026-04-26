import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentAppUser, hasClerkEnv } from "@/lib/auth";

export async function AppAuthBar() {
  const user = await getCurrentAppUser();
  const clerkEnabled = hasClerkEnv();
  const workspaceHref = user ? `/${user.role}` : "/sign-in";
  const primaryCtaHref = user ? workspaceHref : "/sign-up";
  const navLinks = user
    ? [
        { label: "Workspace", href: workspaceHref },
        ...(user.role === "client"
          ? [{ label: "Billing", href: "/client/billing" }]
          : []),
        { label: "Pricing", href: "/#pricing" },
        { label: "About", href: "/about" },
      ]
    : [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "For Writers", href: "/#writers" },
        { label: "About", href: "/#about" },
      ];

  return (
    <div className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] text-sm font-semibold text-white">
              P
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-[-0.03em] text-slate-950">
                Penned
              </p>
              <p className="truncate text-xs text-slate-500">
                {user
                  ? `${user.fullName} · ${user.role}`
                  : clerkEnabled
                    ? "Clerk-enabled workspace"
                    : "Content operations platform"}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link className="button-secondary" href={workspaceHref}>
                Open workspace
              </Link>
              <form action={signOutAction}>
                <button className="button-primary" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="button-secondary" href="/sign-in" prefetch={false}>
                Sign in
              </Link>
              <Link className="button-primary" href={primaryCtaHref} prefetch={false}>
                {user ? "Open workspace" : "Get started"}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
