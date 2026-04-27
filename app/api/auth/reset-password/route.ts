import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Şifre sıfırlama:
 * 1) Kullanıcı varlık kontrolü (GoTrue Admin REST API)
 * 2) Server-side resetPasswordForEmail → PKCE verifier cookie'ye yazılır
 *    (browser-side çağrılırsa verifier kaybolur; server-side'da kalıcı olur)
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const origin      = new URL(request.url).origin;

  // ── 1) Kullanıcı varlık kontrolü ──────────────────────────────
  try {
    const lookupRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalEmail)}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey:        serviceKey,
        },
      }
    );

    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();
      const found = Array.isArray(lookupData?.users) && lookupData.users.length > 0;
      if (!found) {
        return NextResponse.json(
          { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
          { status: 404 }
        );
      }
    }
  } catch {
    // Ağ hatası: devam et
  }

  // ── 2) Server-side resetPasswordForEmail ──────────────────────
  // Server client PKCE verifier'ı cookie'ye yazar (Set-Cookie header ile).
  // Browser daha sonra bu cookie'yi /auth/callback'e gönderir.
  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // PKCE verifier'ın 24 saat geçerli olması için maxAge zorla
            const enhancedOptions = name.includes("code-verifier")
              ? { ...options, maxAge: 60 * 60 * 24, path: "/" }
              : options;
            cookieStore.set(name, value, enhancedOptions);
          });
        },
      },
    }
  );

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    normalEmail,
    { redirectTo: `${origin}/sifre-guncelle` }
  );

  if (resetError) {
    console.error("[reset-password] resetPasswordForEmail error:", resetError.message);
    return NextResponse.json(
      { error: "Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
