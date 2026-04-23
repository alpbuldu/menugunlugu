import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Profili sil (cascade varsa recipes, favorites vs. de silinir)
  await admin.from("profiles").delete().eq("id", user.id);

  // Supabase Auth'dan sil
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: "Hesap silinemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
