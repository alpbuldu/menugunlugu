import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { username } = await request.json();
  const clean = (username ?? "").toLowerCase().trim();

  if (clean.length < 3)
    return NextResponse.json({ error: "Kullanıcı adı en az 3 karakter olmalı." }, { status: 400 });
  if (!/^[a-z0-9_]+$/.test(clean))
    return NextResponse.json({ error: "Sadece küçük harf, rakam ve _ kullanabilirsiniz." }, { status: 400 });

  const admin = createAdminClient();

  // Benzersizlik kontrolü (kendi ID'si hariç)
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
    .update({ username: clean })
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
