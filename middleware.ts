import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject current path for server layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // ── Gizli kapı (portal) ───────────────────────────────────────
  // /admin'e doğrudan erişim engellenir. Önce gizli kapı URL'i
  // ziyaret edilmeli: /api/admin/portal?k=ADMIN_PORTAL_KEY
  // Bu, admin_portal cookie'sini set eder ve /admin/login'e yönlendirir.
  const portalKey   = process.env.ADMIN_PORTAL_KEY ?? "";
  const portalCookie = request.cookies.get("admin_portal");
  const portalValid  = portalKey && portalCookie?.value === portalKey;

  // Portal URL'ini yakala → cookie set et + login'e yönlendir
  if (pathname === "/api/admin/portal") {
    const k = request.nextUrl.searchParams.get("k");
    if (!portalKey || k !== portalKey) {
      return new NextResponse(null, { status: 404 });
    }
    const res = NextResponse.redirect(new URL("/admin/login", request.url));
    res.cookies.set("admin_portal", portalKey, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30, // 30 gün
      path:     "/",
    });
    return res;
  }

  // Auth API'leri her zaman açık (portal şartı yok)
  const isAuthRoute = [
    "/api/admin/login",
    "/api/admin/logout",
    "/api/admin/me",
  ].includes(pathname);

  if (isAuthRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Admin rotaları: önce portal cookie kontrolü
  if (!portalValid) {
    return new NextResponse(null, { status: 404 });
  }

  // Portal tamam → oturum kontrolü
  const isLoginPage  = pathname === "/admin/login";
  if (!isLoginPage) {
    const sessionCookie = request.cookies.get("admin_session");
    const adminSecret   = process.env.ADMIN_SECRET ?? "";

    if (!sessionCookie || !adminSecret || sessionCookie.value !== adminSecret) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
