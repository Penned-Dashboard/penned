import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { rolePath } from "@/lib/types";

export default async function DashboardRouterPage() {
  const user = await getCurrentAppUser();
  const role = user?.role ?? "client";

  redirect(rolePath(role));
}
