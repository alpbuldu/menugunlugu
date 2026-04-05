import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject the current path into request headers so server layouts can read it
  // (Next.js App Router doesn't expose pathname to server components natively)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // ── Admin route protection ────────────────────────────────────────────────
  // /admin/login and the auth API routes are publicly accessible
  const isLoginPage  = pathname === "/admin/login";
  const isAuthRoute  = ["/api/admin/login", "/api/admin/logout", "/api/admin/me"].includes(pathname);

  if (!isLoginPage && !isAuthRoute) {
    const sessionCookie = request.cookies.get("admin_session");
    const adminSecret   = process.env.ADMIN_SECRET ?? "";

    // Reject if cookie is missing or the value doesn't match the secret
    if (!sessionCookie || !adminSecret || sessionCookie.value !== adminSecret) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname); // preserve intended destination
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run middleware on admin UI routes and admin API routes
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
