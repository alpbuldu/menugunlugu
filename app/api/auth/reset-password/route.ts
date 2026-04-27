import { NextRequest, NextResponse } from "next/server";

/**
 * Sadece kullanıcı varlık kontrolü yapar — mail göndermez.
 * resetPasswordForEmail() çağrısı client tarafında (AuthForm) yapılır,
 * böylece PKCE verifier tarayıcıda saklanır.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  } catch { /* devam */ }

  return NextResponse.json({ ok: true });
}
