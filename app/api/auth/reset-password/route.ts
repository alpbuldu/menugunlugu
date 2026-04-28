import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Kullanıcı varlık kontrolü — service role ile auth.users tablosunu sorgular.
 * GoTrue rate limit'ini tetiklemeden e-posta kontrolü yapar.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }

  const normalEmail = email.trim().toLowerCase();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // GoTrue admin users — filter sadece arama stringi alır (SQL syntax değil)
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(normalEmail)}&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );

    if (res.ok) {
      const body = await res.json();
      const users: { email?: string }[] = body?.users ?? [];
      const found = users.some(u => u.email?.toLowerCase() === normalEmail);

      if (!found) {
        return NextResponse.json(
          { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
          { status: 404 }
        );
      }
    }
    // res.ok değilse sessizce geç
  } catch {
    // ağ hatası → sessizce geç
  }

  return NextResponse.json({ ok: true });
}
