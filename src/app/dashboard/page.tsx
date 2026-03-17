import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRole } from "@/lib/types";

export default async function DashboardRouterPage() {
  const roleCookie = (await cookies()).get("penned-role")?.value ?? "client";
  const role = isRole(roleCookie) ? roleCookie : "client";

  redirect(`/${role}`);
}
