import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Mail servisi yapılandırılmamış" }, { status: 500 });
  }

  const adminClient = createAdminClient();
  const origin = request.nextUrl.origin;

  // Supabase Admin ile şifre sıfırlama linki üret
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: `${origin}/sifre-guncelle`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    // Kullanıcıya spesifik hata vermiyoruz (email enumeration güvenliği)
    // Ama 200 dönüyoruz ki "mail gönderildi" görünsün
    console.error("[reset-password] generateLink error:", linkError);
    return NextResponse.json({ ok: true });
  }

  const resetLink = linkData.properties.action_link;

  // Resend ile e-posta gönder
  const resend = new Resend(resendKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@menugunlugu.com";

  const { error: mailError } = await resend.emails.send({
    from: `Menü Günlüğü <${fromEmail}>`,
    to: email.trim().toLowerCase(),
    subject: "Menü Günlüğü — Şifre Sıfırlama",
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf9f7;margin:0;padding:32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#fff;border-radius:16px;border:1px solid #e8e5e0;padding:40px 32px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:36px;margin-bottom:8px;">🍽️</div>
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#1c1917;">Menü Günlüğü</h1>
        </div>
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#292524;">Şifre Sıfırlama</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.6;">
          Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.
          Bu link <strong>1 saat</strong> geçerlidir.
        </p>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${resetLink}"
            style="display:inline-block;background:#c2410c;color:#fff;font-size:15px;font-weight:600;
                   padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;">
            Şifremi Sıfırla →
          </a>
        </div>
        <p style="margin:0 0 8px;font-size:12px;color:#a8a29e;">
          Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
        </p>
        <hr style="border:none;border-top:1px solid #e8e5e0;margin:24px 0 16px;">
        <p style="margin:0;font-size:11px;color:#d6d3d1;text-align:center;">
          © ${new Date().getFullYear()} Menü Günlüğü · menugunlugu.com
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (mailError) {
    console.error("[reset-password] resend error:", mailError);
    return NextResponse.json({ error: "Mail gönderilemedi, lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
