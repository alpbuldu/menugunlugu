import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { email, password, username, marketing_consent } = await request.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Check username uniqueness
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

  // Create user via regular signUp — this sends a real confirmation email
  const anonClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const origin = request.nextUrl.origin;
  const { data, error } = await anonClient.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        marketing_consent: !!marketing_consent,
      },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already registered")) {
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

  // data.user is null when email is already registered (Supabase returns no error for privacy)
  if (!data.user) {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı veya şifre sıfırlamayı deneyin." },
      { status: 409 }
    );
  }

  // Profile is created by DB trigger, but upsert as safety net
  await adminClient.from("profiles").upsert({
    id:       data.user.id,
    username: username.toLowerCase().trim(),
  }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
