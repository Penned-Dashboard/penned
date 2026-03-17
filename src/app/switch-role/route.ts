import { NextRequest, NextResponse } from "next/server";
import { isRole, type Role } from "@/lib/types";

export function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  const next = request.nextUrl.searchParams.get("next") || "/";
  const safeRole: Role = isRole(role) ? role : "client";

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set("penned-role", safeRole, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
