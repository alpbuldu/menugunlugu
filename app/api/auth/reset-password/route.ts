import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const siteOrigin  = request.nextUrl.origin;

  // ── 1) Kullanıcı varlık kontrolü ──────────────────────────────────
  const genRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey:        serviceKey,
    },
    body: JSON.stringify({
      type:        "recovery",
      email:       normalEmail,
      redirect_to: `${siteOrigin}/sifre-guncelle`,
    }),
  });

  if (!genRes.ok) {
    return NextResponse.json(
      { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
      { status: 404 }
    );
  }

  // ── 2) Supabase SMTP (Brevo) ile mail gönder ───────────────────────
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll()      { return cookieStore.getAll(); },
      setAll(list)  {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch { /* Server Component context */ }
      },
    },
  });

  const redirectTo =
    `${siteOrigin}/auth/callback?next=${encodeURIComponent("/sifre-guncelle")}`;

  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
    normalEmail,
    { redirectTo }
  );

  if (resetErr) {
    // Geçici: debug için gerçek hata mesajını döndür
    return NextResponse.json(
      { error: `Hata: ${resetErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
