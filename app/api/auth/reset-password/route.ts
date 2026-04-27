import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Şifre sıfırlama — PKCE olmadan (implicit flow):
 * 1) Kullanıcı varlık kontrolü (GoTrue Admin REST API)
 * 2) resetPasswordForEmail — implicit flow ile (code_challenge gönderilmez)
 *    → Supabase kodu code_challenge olmadan oluşturur
 *    → /auth/callback'te verifier olmadan exchange edilebilir
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail  = email.trim().toLowerCase();
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const origin       = new URL(request.url).origin;

  // ── 1) Kullanıcı varlık kontrolü ──────────────────────────────
  try {
    const lookupRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalEmail)}&per_page=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
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
  } catch { /* devam */ }

  // ── 2) resetPasswordForEmail — implicit flow (PKCE olmadan) ──
  // flowType: 'implicit' → code_challenge gönderilmez
  // Supabase'in oluşturduğu kod verifier olmadan exchange edilebilir
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      flowType:        "implicit",
      persistSession:  false,
      autoRefreshToken: false,
    },
  });

  const redirectTo = `${origin}/auth/callback?next=%2Fsifre-guncelle`;
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(
    normalEmail,
    { redirectTo }
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
