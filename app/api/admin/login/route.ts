import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminSecret   = process.env.ADMIN_SECRET   ?? "";

  if (!adminPassword || !adminSecret) {
    return NextResponse.json(
      { error: "Admin kimlik bilgileri sunucuda yapılandırılmamış." },
      { status: 500 }
    );
  }

  if (password !== adminPassword) {
    // Uniform delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Hatalı şifre." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin_session", adminSecret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     "/",
  });

  return response;
}
