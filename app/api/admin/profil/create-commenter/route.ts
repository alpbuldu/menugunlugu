import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function isAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");
  const adminSecret   = process.env.ADMIN_SECRET ?? "";
  return sessionCookie && adminSecret && sessionCookie.value === adminSecret;
}

// POST — admin için otomatik yorum hesabı oluştur
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Admin profil bilgilerini al
  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username, avatar_url, bio")
    .eq("id", 1)
    .single();

  if (!adminProfile?.username) {
    return NextResponse.json({ error: "Admin profili bulunamadı." }, { status: 500 });
  }

  const username   = adminProfile.username.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
  const email      = `admin-${username}@menugunlugu.com`;
  const password   = crypto.randomUUID() + crypto.randomUUID(); // güçlü rastgele şifre

  // Profilde zaten bu username var mı?
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    // Zaten var — avatar ve full_name güncelle, comment_user_id kaydet
    await supabase
      .from("profiles")
      .update({ avatar_url: adminProfile.avatar_url ?? null, full_name: adminProfile.username })
      .eq("id", existing.id);
    await supabase
      .from("admin_profile")
      .update({ comment_user_id: existing.id })
      .eq("id", 1);
    return NextResponse.json({ id: existing.id, username, existed: true });
  }

  // Auth user oluştur
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (authError || !authData.user) {
    // Email zaten alınmışsa user'ı bul
    if (authError?.message?.includes("already")) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const found = users?.users?.find(u => u.email === email);
      if (found) {
        await supabase.from("admin_profile").update({ comment_user_id: found.id }).eq("id", 1);
        return NextResponse.json({ id: found.id, username, existed: true });
      }
    }
    return NextResponse.json({ error: authError?.message ?? "Auth user oluşturulamadı." }, { status: 500 });
  }

  const userId = authData.user.id;

  // Profil oluştur
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id:         userId,
      username,
      full_name:  adminProfile.username,
      avatar_url: adminProfile.avatar_url ?? null,
      bio:        adminProfile.bio ?? null,
    });

  if (profileError) {
    return NextResponse.json({ error: `Profil oluşturulamadı: ${profileError.message}` }, { status: 500 });
  }

  // comment_user_id kaydet
  await supabase
    .from("admin_profile")
    .update({ comment_user_id: userId })
    .eq("id", 1);

  return NextResponse.json({ id: userId, username, existed: false });
}
