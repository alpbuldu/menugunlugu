import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { token, platform } = await req.json() as { token: string; platform: string };
  if (!token?.trim()) return NextResponse.json({ error: "Token zorunlu." }, { status: 400 });

  // Bearer token ile kullanıcı doğrula
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const jwt = authHeader.slice(7);
  const admin = createAdminClient();
  const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  const t = token.trim();
  // unique constraint yoksa önce var mı bak, yoksa ekle
  const { data: existing } = await admin
    .from("push_tokens")
    .select("id")
    .eq("user_id", user.id)
    .eq("token", t)
    .maybeSingle();

  if (!existing) {
    const { error } = await admin.from("push_tokens").insert(
      { user_id: user.id, token: t, platform: platform ?? "unknown" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
