import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Kullanıcı varlık kontrolü — GoTrue rate limit'ini tetiklemeden
 * service role ile auth admin API'sini kullanır.
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
    // Admin users list — email ile filtrele (per_page=1 yeterli)
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email eq "${normalEmail}"`)}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );

    if (res.ok) {
      const body = await res.json();
      const found = Array.isArray(body?.users) && body.users.length > 0
        && body.users[0]?.email?.toLowerCase() === normalEmail;

      if (!found) {
        return NextResponse.json(
          { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
          { status: 404 }
        );
      }
    }
    // res.ok değilse sessizce geç — browser tarafı resetPasswordForEmail çağırır
  } catch {
    // ağ hatası vb. → sessizce geç
  }

  return NextResponse.json({ ok: true });
}
