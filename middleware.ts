import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// We create an edge-compatible NextAuth instance just for the middleware.
// This avoids importing Prisma or any Node-only modules into the Edge runtime.
const { auth } = NextAuth({
  providers: [],
});

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — no auth needed
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
