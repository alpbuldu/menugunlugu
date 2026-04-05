import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin   = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/admin/login", origin));

  response.cookies.set("admin_session", "", {
    httpOnly: true,
    maxAge:   0,
    path:     "/",
  });

  return response;
}
