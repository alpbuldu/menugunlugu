import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email, password, username } = await request.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check username uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten alınmış." },
      { status: 409 }
    );
  }

  // Create user (auto-confirm email via admin client)
  const { data, error } = await supabase.auth.admin.createUser({
    email:         email.trim(),
    password,
    user_metadata: { username: username.toLowerCase().trim() },
    email_confirm: true,
  });

  if (error || !data.user) {
    // Handle common errors
    if (error?.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? "Kayıt başarısız." },
      { status: 500 }
    );
  }

  // Profile is created by DB trigger, but upsert as safety net
  await supabase.from("profiles").upsert({
    id:       data.user.id,
    username: username.toLowerCase().trim(),
  }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
