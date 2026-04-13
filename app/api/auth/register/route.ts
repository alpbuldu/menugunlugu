import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const { email, password, username, marketing_consent } = await request.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Kullanıcı adı benzersizlik kontrolü
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten alınmış." },
      { status: 409 }
    );
  }

  const origin = request.nextUrl.origin;

  // admin.generateLink ile kullanıcı oluştur + onay linki al
  // Bu yöntem email_confirm: false olarak oluşturur ve onay URL'i döner
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "signup",
    email: email.trim(),
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        marketing_consent: !!marketing_consent,
      },
      redirectTo: `${origin}/auth/confirm`,
    },
  });

  if (linkError) {
    if (
      linkError.message?.toLowerCase().includes("already registered") ||
      linkError.message?.toLowerCase().includes("already been registered")
    ) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: linkError.message ?? "Kayıt başarısız." },
      { status: 500 }
    );
  }

  if (!linkData?.user || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu." },
      { status: 500 }
    );
  }

  const confirmUrl = linkData.properties.action_link;
  const userId     = linkData.user.id;
  const uname      = username.toLowerCase().trim();

  // Profil upsert (trigger yoksa da çalışsın)
  await adminClient.from("profiles").upsert(
    { id: userId, username: uname },
    { onConflict: "id" }
  );

  // Resend ile onay e-postası gönder
  const resendKey  = process.env.RESEND_API_KEY;
  let   emailResult: any = null;

  if (resendKey) {
    try {
      const resend   = new Resend(resendKey);
      const fromAddr = process.env.RESEND_FROM ?? "Menü Günlüğü <onboarding@resend.dev>";
      emailResult = await resend.emails.send({
        from:    fromAddr,
        to:      email.trim(),
        subject: "E-posta adresinizi onaylayın — Menü Günlüğü",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:2rem;">🍽️</span>
              <h1 style="font-size:1.4rem;font-weight:700;color:#5c3221;margin:8px 0 4px;">Menü Günlüğü</h1>
            </div>
            <h2 style="font-size:1.1rem;font-weight:600;color:#2d1f0f;margin:0 0 12px;">Merhaba @${uname}!</h2>
            <p style="color:#7a5c3c;line-height:1.6;margin:0 0 24px;">
              Menü Günlüğü'ne hoş geldin! Hesabını aktifleştirmek için aşağıdaki butona tıkla.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${confirmUrl}"
                 style="display:inline-block;background:#d4821e;color:#fff;font-weight:600;
                        font-size:0.95rem;padding:14px 32px;border-radius:12px;
                        text-decoration:none;">
                E-postamı Onayla
              </a>
            </div>
            <p style="color:#b08060;font-size:0.8rem;line-height:1.5;margin:24px 0 0;">
              Bu butona tıklayamıyorsan şu adresi tarayıcına kopyala:<br/>
              <span style="color:#d4821e;word-break:break-all;">${confirmUrl}</span>
            </p>
            <hr style="border:none;border-top:1px solid #edd8bc;margin:24px 0;" />
            <p style="color:#c09060;font-size:0.75rem;text-align:center;margin:0;">
              Bu e-postayı beklemiyor musun? Güvenle görmezden gelebilirsin.
            </p>
          </div>
        `,
      });
    } catch (emailErr: any) {
      emailResult = { error: emailErr?.message ?? String(emailErr) };
    }
  } else {
    emailResult = { error: "RESEND_API_KEY yok" };
  }

  return NextResponse.json({
    ok:           true,
    resend_key:   !!resendKey,
    email_result: emailResult,
  });
}
