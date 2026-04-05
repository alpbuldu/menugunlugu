import { NextRequest, NextResponse } from "next/server";

/** Simple session-check used by the login page to redirect already-authed users. */
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");
  const adminSecret   = process.env.ADMIN_SECRET ?? "";

  if (sessionCookie && adminSecret && sessionCookie.value === adminSecret) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
