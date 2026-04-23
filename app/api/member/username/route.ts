import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MAX_CHANGES = 3;

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { username } = await request.json();
  const clean = (username ?? "").toLowerCase().trim();

  if (!/^[a-z0-9_]{3,16}$/.test(clean))
    return NextResponse.json({ error: "Kullanıcı adı 3-16 karakter, sadece harf/rakam/alt çizgi olabilir." }, { status: 400 });

  const RESERVED = ["__admin__", "admin"];
  if (RESERVED.includes(clean))
    return NextResponse.json({ error: "Bu kullanıcı adı kullanılamaz." }, { status: 409 });

  const admin = createAdminClient();

  // Admin'in gerçek kullanıcı adını da blokla
  const { data: adminProfile } = await admin
    .from("admin_profile")
    .select("username")
    .eq("id", 1)
    .single();

  if (adminProfile?.username && clean === adminProfile.username.toLowerCase())
    return NextResponse.json({ error: "Bu kullanıcı adı kullanılamaz." }, { status: 409 });

  // Mevcut profili çek (değişim sayısını kontrol için)
  const { data: profile } = await admin
    .from("profiles")
    .select("username, username_change_count")
    .eq("id", user.id)
    .single();

  if (!profile)
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });

  // Aynı kullanıcı adıysa değişim sayma
  if (profile.username === clean)
    return NextResponse.json({ error: "Bu zaten mevcut kullanıcı adınız." }, { status: 400 });

  const changeCount = profile.username_change_count ?? 0;
  if (changeCount >= MAX_CHANGES)
    return NextResponse.json({
      error: `Kullanıcı adınızı en fazla ${MAX_CHANGES} kez değiştirebilirsiniz. Limitinize ulaştınız.`,
    }, { status: 403 });

  // Benzersizlik kontrolü
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .neq("id", user.id)
    .maybeSingle();

  if (existing)
    return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });

  const { error } = await admin
    .from("profiles")
    .update({
      username: clean,
      username_change_count: changeCount + 1,
    })
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });

  return NextResponse.json({ ok: true, remaining: MAX_CHANGES - (changeCount + 1) });
}
