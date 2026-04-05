import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const adminUsername = process.env.ADMIN_USERNAME ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminSecret   = process.env.ADMIN_SECRET   ?? "";

  if (!adminUsername || !adminPassword || !adminSecret) {
    return NextResponse.json(
      { error: "Admin kimlik bilgileri sunucuda yapılandırılmamış." },
      { status: 500 }
    );
  }

  // Uniform delay — timing attack koruması
  await new Promise((r) => setTimeout(r, 400));

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin_session", adminSecret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 gün
    path:     "/",
  });

  return response;
}
