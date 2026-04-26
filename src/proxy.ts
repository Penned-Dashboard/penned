import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { hasClerkEnv } from "@/lib/auth";
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/client(.*)",
  "/writer(.*)",
  "/admin(.*)",
]);

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (hasClerkEnv()) {
    return clerkProxy(request, event);
  }

  const { pathname } = request.nextUrl;
  const currentSession = request.cookies.get("penned-session")?.value;

  if (
    (pathname === "/dashboard" ||
      pathname.startsWith("/client") ||
      pathname.startsWith("/writer") ||
      pathname.startsWith("/admin")) &&
    !currentSession
  ) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
