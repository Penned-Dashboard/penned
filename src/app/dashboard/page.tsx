import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";

export default async function DashboardRouterPage() {
  const user = await getCurrentAppUser();
  const role = user?.role ?? "client";

  redirect(`/${role}`);
}
