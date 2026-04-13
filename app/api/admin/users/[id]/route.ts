import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const supabase = createAdminClient();

  // Avatar dosyasını sil (varsa)
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", id)
    .single();

  if (profile?.avatar_url) {
    try {
      const url   = new URL(profile.avatar_url);
      const parts = url.pathname.split("/object/public/avatars/");
      if (parts[1]) {
        await supabase.storage.from("avatars").remove([parts[1]]);
      }
    } catch {
      // storage silme hatası kritik değil
    }
  }

  // Auth hesabını tamamen sil — oturumu geçersiz kılar, profil cascade silinir
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
