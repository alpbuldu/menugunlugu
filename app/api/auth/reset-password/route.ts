import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const origin      = request.nextUrl.origin;

  const adminClient = createAdminClient();

  // generateLink hem kullanıcı varlığını kontrol eder hem linki üretir
  const { data, error: linkError } = await adminClient.auth.admin.generateLink({
    type:    "recovery",
    email:   normalEmail,
    options: { redirectTo: `${origin}/auth/callback?next=/sifre-guncelle` },
  });

  if (linkError || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
      { status: 404 }
    );
  }

  const resetLink = data.properties.action_link;

  // Resend ile gönder — onboarding@resend.dev domain doğrulaması gerektirmez
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[reset-password] RESEND_API_KEY eksik");
    return NextResponse.json({ error: "Mail servisi yapılandırılmamış." }, { status: 500 });
  }

  const resend   = new Resend(resendKey);
  const fromAddr = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const { error: mailError } = await resend.emails.send({
    from:    `Menü Günlüğü <${fromAddr}>`,
    to:      normalEmail,
    subject: "Menü Günlüğü — Şifre Sıfırlama",
    html: `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#fdf9f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf9f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-size:40px;line-height:1;margin-bottom:10px;">🍽️</div>
            <div style="font-size:22px;font-weight:700;color:#5c3221;">Menü Günlüğü</div>
            <div style="font-size:13px;color:#c07840;margin-top:4px;">menugunlugu.com</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:20px;border:1px solid #edd8bc;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#d4821e 0%,#b86515 100%);height:6px;"></div>
            <div style="padding:40px 36px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#5c3221;">Şifre Sıfırlama 🔐</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#a85e30;font-weight:500;">Menü Günlüğü hesabın için şifre sıfırlama talebi aldık.</p>
              <p style="margin:0 0 28px;font-size:15px;color:#713c25;line-height:1.7;">Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın. Bu link <strong>1 saat</strong> geçerlidir.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${resetLink}" style="display:inline-block;background:#d4821e;color:#ffffff;font-size:15px;font-weight:600;padding:15px 36px;border-radius:12px;text-decoration:none;">
                      🔑 Şifremi Sıfırla
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background:#fdf8f0;border:1px solid #f4daa8;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#924c12;line-height:1.6;">🛡️ <strong>Bu talebi siz yapmadıysanız</strong> bu e-postayı görmezden gelebilirsiniz. Hesabınız güvende, şifreniz değişmeyecektir.</p>
              </div>
              <hr style="border:none;border-top:1px solid #f7ede0;margin:0 0 20px;">
              <p style="margin:0;font-size:12px;color:#ce9660;line-height:1.6;">Butona tıklayamıyorsan aşağıdaki bağlantıya tıkla:</p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="${resetLink}" style="color:#b86515;text-decoration:underline;font-weight:500;">menugunlugu.com → Şifremi Sıfırla</a>
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-size:11px;color:#ce9660;">© ${new Date().getFullYear()} Menü Günlüğü · <a href="https://menugunlugu.com" style="color:#b86515;text-decoration:none;">menugunlugu.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (mailError) {
    console.error("[reset-password] resend error:", mailError);
    return NextResponse.json(
      { error: "Mail gönderilemedi, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
