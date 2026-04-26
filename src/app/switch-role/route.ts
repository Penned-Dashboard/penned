import { NextRequest, NextResponse } from "next/server";
import { hasClerkEnv } from "@/lib/auth";

export function GET(request: NextRequest) {
  if (hasClerkEnv()) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL("/sign-in", request.url));
}
