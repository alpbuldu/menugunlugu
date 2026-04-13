import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email, password, username, marketing_consent } = await request.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Kullanıcı adı benzersizlik kontrolü
  const { data: existing } = await adminClient
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

  const origin = request.nextUrl.origin;
  const uname  = username.toLowerCase().trim();

  // signUp → Supabase custom SMTP ile onay maili gönderir
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        username: uname,
        marketing_consent: !!marketing_consent,
      },
    },
  });

  if (error) {
    if (
      error.message?.toLowerCase().includes("already registered") ||
      error.message?.toLowerCase().includes("already been registered")
    ) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message ?? "Kayıt başarısız." },
      { status: 500 }
    );
  }

  if (!data?.user) {
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu." },
      { status: 500 }
    );
  }

  // Profil upsert (trigger yoksa da çalışsın)
  await adminClient.from("profiles").upsert(
    { id: data.user.id, username: uname },
    { onConflict: "id" }
  );

  return NextResponse.json({ ok: true });
}
