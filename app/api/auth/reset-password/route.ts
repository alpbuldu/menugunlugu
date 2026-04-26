import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const supabase = await createClient();
  const origin   = request.nextUrl.origin;

  // Supabase SMTP üzerinden şifre sıfırlama maili gönder
  // Dashboard → Auth → URL Configuration'a origin/sifre-guncelle eklenmiş olmalı
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${origin}/sifre-guncelle` }
  );

  if (error) {
    console.error("[reset-password]", error.message);
    // Güvenlik: kullanıcıya e-posta var mı yok mu söyleme, her zaman başarı dön
  }

  // Her durumda 200 dön (email enumeration saldırısını önler)
  return NextResponse.json({ ok: true });
}
