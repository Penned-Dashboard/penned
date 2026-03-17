import { NextResponse, type NextRequest } from "next/server";
import { isRole } from "@/lib/types";

const protectedPrefixes = ["/client", "/writer", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard") {
    return NextResponse.next();
  }

  const matchedPrefix = protectedPrefixes.find((prefix) => pathname.startsWith(prefix));

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  const expectedRole = matchedPrefix.slice(1);
  const currentRole = request.cookies.get("penned-role")?.value;

  if (!currentRole || !isRole(currentRole) || currentRole === expectedRole) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(`/${currentRole}`, request.url));
}

export const config = {
  matcher: ["/dashboard", "/client/:path*", "/writer/:path*", "/admin/:path*"],
};
