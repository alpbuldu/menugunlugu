import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { following_id, is_admin } = await request.json();

  const admin = createAdminClient();

  // Admin takip sistemi — ayrı tablo
  if (is_admin) {
    const { data: existing } = await admin
      .from("admin_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .maybeSingle();

    if (existing) {
      await admin.from("admin_follows").delete().eq("follower_id", user.id);
      return NextResponse.json({ following: false });
    } else {
      await admin.from("admin_follows").insert({ follower_id: user.id });
      return NextResponse.json({ following: true });
    }
  }

  // Normal üye takip
  if (!following_id || following_id === user.id)
    return NextResponse.json({ error: "Geçersiz." }, { status: 400 });

  const { data: existing } = await admin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", following_id)
    .maybeSingle();

  if (existing) {
    await admin.from("follows").delete()
      .eq("follower_id", user.id).eq("following_id", following_id);
    return NextResponse.json({ following: false });
  } else {
    await admin.from("follows").insert({ follower_id: user.id, following_id });
    return NextResponse.json({ following: true });
  }
}
