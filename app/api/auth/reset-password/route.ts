import { NextRequest, NextResponse } from "next/server";

/**
 * Şifre sıfırlama:
 * 1) GoTrue Admin API'sinin generate_link endpoint'i ile recovery linki üretir.
 *    Kullanıcı yoksa 422 döner → "kayıtlı değil" hatası gösterilir.
 * 2) Linki Resend API üzerinden e-posta olarak gönderir.
 * PKCE flow yok — tarayıcıda verifier saklamak gerekmez.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail  = email.trim().toLowerCase();
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const resendKey    = process.env.RESEND_API_KEY ?? "";
  const siteOrigin   = request.nextUrl.origin; // https://menugunlugu.com

  // ── 1) GoTrue Admin: generate_link ─────────────────────────────
  // redirect_to: kullanıcı linke tıkladıktan sonra GoTrue'nun
  // yönlendireceği URL. Hash'te access_token + type=recovery gelir.
  const genRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${serviceKey}`,
      apikey:         serviceKey,
    },
    body: JSON.stringify({
      type:        "recovery",
      email:       normalEmail,
      redirect_to: `${siteOrigin}/sifre-guncelle`,
    }),
  });

  if (!genRes.ok) {
    let msg = "";
    try { msg = ((await genRes.json()) as { message?: string; error?: string }).message ?? ""; } catch { /* ignore */ }
    // GoTrue 422 döner → kullanıcı bulunamadı
    return NextResponse.json(
      { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
      { status: 404 }
    );
  }

  const genData   = (await genRes.json()) as { action_link?: string };
  const actionLink = genData.action_link ?? "";

  if (!actionLink) {
    return NextResponse.json({ error: "Link oluşturulamadı. Lütfen tekrar deneyin." }, { status: 500 });
  }

  // ── 2) Resend ile e-posta gönder ───────────────────────────────
  if (!resendKey) {
    // Geliştirme ortamı: anahtarı konsola yaz
    console.log("[reset-password] action_link:", actionLink);
    return NextResponse.json({ ok: true });
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from:    "Menü Günlüğü <noreply@menugunlugu.com>",
      to:      [normalEmail],
      subject: "Şifrenizi sıfırlayın — Menü Günlüğü",
      html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e5e0;overflow:hidden;">
    <div style="background:#b45309;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🍽️ Menü Günlüğü</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#1c1917;font-size:18px;">Şifre Sıfırlama</h2>
      <p style="margin:0 0 16px;color:#44403c;font-size:15px;line-height:1.6;">
        Menü Günlüğü hesabınız için şifre sıfırlama isteği aldık.<br>
        Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
      </p>
      <p style="margin:24px 0;">
        <a href="${actionLink}"
           style="display:inline-block;background:#d97706;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Şifremi Sıfırla
        </a>
      </p>
      <p style="margin:0 0 8px;color:#78716c;font-size:13px;">
        Butona tıklayamıyorsanız bu linki kopyalayıp tarayıcınıza yapıştırın:
      </p>
      <p style="margin:0 0 24px;word-break:break-all;font-size:12px;color:#a8a29e;">${actionLink}</p>
      <hr style="border:none;border-top:1px solid #e5e5e0;margin:0 0 16px;">
      <p style="margin:0;color:#a8a29e;font-size:12px;">
        Bu isteği siz yapmadıysanız bu e-postayı dikkate almayınız. Link 1 saat geçerlidir.
      </p>
    </div>
  </div>
</body>
</html>`,
    }),
  });

  if (!emailRes.ok) {
    const errBody = await emailRes.json().catch(() => ({}));
    console.error("[reset-password] Resend error:", errBody);
    return NextResponse.json(
      { error: "E-posta gönderilemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
