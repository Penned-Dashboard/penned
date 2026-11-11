import { redirect } from "next/navigation";
import { ClientSignupFlow } from "@/components/client-signup-flow";
import { getCurrentAppUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();

  if (user) {
    redirect(`/${user.role}`);
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
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden text-white lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">
              For agencies
            </p>
            <h2 className="mt-4 max-w-lg text-4xl font-semibold tracking-[-0.04em]">
              Content ops without chasing writers
            </h2>
            <ul className="mt-8 space-y-4 text-base leading-7 text-white/80">
              <li>Writers matched to your clients’ industries</li>
              <li>Every piece edited by a human before delivery</li>
              <li>Free samples by industry, any time</li>
            </ul>
            <blockquote className="mt-10 max-w-md border-l-2 border-white/30 pl-5 text-sm leading-7 text-white/75">
              “I used to chase writers for updates. Now, I just get a Slack ping when my content is
              ready.”
              <footer className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">
                Emily D., Content Manager
              </footer>
            </blockquote>
          </aside>
          <ClientSignupFlow error={params.error} />
        </div>
      </div>
    </main>
  );
}
