import { NextRequest, NextResponse } from "next/server";

/**
 * Şifre sıfırlama:
 * GoTrue Admin generate_link → hem kullanıcı varlığını kontrol eder
 * hem de Supabase'in kendi SMTP'siyle (Brevo) maili gönderir.
 * Kullanıcı linke tıkladığında GoTrue doğrular ve /sifre-guncelle#access_token=...
 * adresine yönlendirir; PasswordUpdateForm hash'teki token'ı okur.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const siteOrigin  = request.nextUrl.origin;

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
    // 422 = kullanıcı bulunamadı
    return NextResponse.json(
      { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
