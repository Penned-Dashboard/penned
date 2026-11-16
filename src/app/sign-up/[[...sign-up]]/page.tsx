import { redirect } from "next/navigation";
import { ClientSignupFlow } from "@/components/client-signup-flow";
import { getCurrentAppUser } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentAppUser();

  if (user) {
    redirect(rolePath(user.role));
  }

  // Public signup is client-only; writers/editors are invited.
  if (params.role && params.role !== "client") {
    redirect("/contact");
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
        <div className="flex w-full justify-center">
          <ClientSignupFlow error={params.error} />
        </div>
      </div>
    </main>
  );
}
