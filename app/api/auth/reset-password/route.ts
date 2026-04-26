import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const origin      = request.nextUrl.origin;
  const redirectTo  = `${origin}/auth/callback?next=/sifre-guncelle`;

  // Admin client ile kullanıcının kayıtlı olup olmadığını kontrol et.
  // generateLink, kullanıcı yoksa hata döner.
  const adminClient = createAdminClient();
  const { error: linkError } = await adminClient.auth.admin.generateLink({
    type:    "recovery",
    email:   normalEmail,
    options: { redirectTo },
  });

  if (linkError) {
    // "User not found" veya benzeri → kullanıcı kayıtlı değil
    return NextResponse.json(
      { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
      { status: 404 }
    );
  }

  // Kullanıcı var — Supabase/Brevo SMTP üzerinden gerçek maili gönder
  const supabase = await createClient();
  const { error: mailError } = await supabase.auth.resetPasswordForEmail(
    normalEmail,
    { redirectTo }
  );

  if (mailError) {
    console.error("[reset-password] mail error:", mailError.message);
    return NextResponse.json(
      { error: "Mail gönderilemedi, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
