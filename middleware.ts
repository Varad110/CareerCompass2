import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
