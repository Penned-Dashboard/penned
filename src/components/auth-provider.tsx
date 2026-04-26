import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkEnv } from "@/lib/auth";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!hasClerkEnv()) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
