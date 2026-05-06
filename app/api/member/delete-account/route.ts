import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const admin = createAdminClient();

  // Bearer token (mobil) veya cookie (web) ile kimlik doğrulama
  let userId: string | null = null;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await admin.auth.getUser(token);
    userId = user?.id ?? null;
  }
  if (!userId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  // Profili sil (cascade varsa recipes, favorites vs. de silinir)
  await admin.from("profiles").delete().eq("id", userId);

  // Supabase Auth'dan sil
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: "Hesap silinemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
