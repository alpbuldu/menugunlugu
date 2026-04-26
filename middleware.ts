import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Supabase session refresh ─────────────────────────────────────
  // Must run on every request to keep JWT tokens fresh.
  // Creates a response object that can have cookies set on it.
  let response = NextResponse.next({
    request: {
      headers: (() => {
        const h = new Headers(request.headers);
        h.set("x-pathname", pathname); // inject for server layouts
        return h;
      })(),
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Write updated cookies to both request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          const h = new Headers(request.headers);
          h.set("x-pathname", pathname);
          response = NextResponse.next({ request: { headers: h } });
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Auth callback — her zaman geçsin (PKCE code exchange) ──────
  if (pathname.startsWith("/auth/callback")) return response;

  // ── Protected member routes ──────────────────────────────────────
  const memberRoutes = ["/uye/panel", "/tarif-ekle"];
  const isMemberRoute = memberRoutes.some((r) => pathname.startsWith(r));
  if (isMemberRoute && !user) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Non-admin routes: return here ───────────────────────────────
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminRoute) return response;

  // ════════════════════════════════════════════════════════════════
  // Admin route handling (existing logic below)
  // ════════════════════════════════════════════════════════════════
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const portalKey    = process.env.ADMIN_PORTAL_KEY ?? "";
  const portalCookie = request.cookies.get("admin_portal");
  const portalValid  = portalKey && portalCookie?.value === portalKey;

  // Portal URL
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
      maxAge:   60 * 60 * 24 * 30,
      path:     "/",
    });
    return res;
  }

  // Auth API routes — always open
  const isAuthRoute = [
    "/api/admin/login",
    "/api/admin/logout",
    "/api/admin/me",
  ].includes(pathname);
  if (isAuthRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Portal check
  if (!portalValid) {
    return new NextResponse(null, { status: 404 });
  }

  // Session check
  const isLoginPage = pathname === "/admin/login";
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
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
