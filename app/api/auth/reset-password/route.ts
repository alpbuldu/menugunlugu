import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Şifre sıfırlama:
 * 1) GoTrue Admin generate_link → kullanıcı varlık kontrolü (422 = kayıtlı değil).
 * 2) createServerClient ile resetPasswordForEmail → Supabase kendi SMTP'siyle
 *    (Brevo) maili gönderir; PKCE verifier'ı Set-Cookie ile browser'a yazar.
 *    Browser linke tıkladığında cookie hazır olduğu için /auth/callback exchange'i başarır.
 */
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
  // generate_link başarılı olursa kullanıcı var demektir; linki kullanmıyoruz.
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
  // createServerClient PKCE verifier'ı cookiesToSet listesine yazar.
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() { return []; },
      setAll(list) { cookiesToSet.push(...list); },
    },
  });

  // redirectTo: GoTrue bu URL'ye &code=xxx ekler → /auth/callback next=/sifre-guncelle
  const redirectTo =
    `${siteOrigin}/auth/callback?next=${encodeURIComponent("/sifre-guncelle")}`;

  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
    normalEmail,
    { redirectTo }
  );

  if (resetErr) {
    console.error("[reset-password] resetPasswordForEmail error:", resetErr.message);
    return NextResponse.json(
      { error: "E-posta gönderilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  // PKCE verifier'ı browser'a cookie olarak ilet (Set-Cookie header)
  const response = NextResponse.json({ ok: true });
  cookiesToSet.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any);
  });
  return response;
}
