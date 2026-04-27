import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { email, password, username, marketing_consent } = await request.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const unameTrimmed = username.toLowerCase().trim();

  // Format kontrolü (3-16 karakter, harf/rakam/alt çizgi)
  if (!/^[a-z0-9_]{3,16}$/.test(unameTrimmed)) {
    return NextResponse.json(
      { error: "Kullanıcı adı 3-16 karakter, sadece harf/rakam/alt çizgi olabilir." },
      { status: 400 }
    );
  }

  // Rezerve adlar — admin sistem adı
  const RESERVED = ["__admin__", "admin"];
  if (RESERVED.includes(unameTrimmed)) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı kullanılamaz." },
      { status: 409 }
    );
  }

  // Admin'in gerçek kullanıcı adını da blokla
  const { data: adminProfile } = await adminClient
    .from("admin_profile")
    .select("username")
    .eq("id", 1)
    .single();

  if (adminProfile?.username && unameTrimmed === adminProfile.username.toLowerCase()) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı kullanılamaz." },
      { status: 409 }
    );
  }

  // Kullanıcı adı benzersizlik kontrolü
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", unameTrimmed)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten alınmış." },
      { status: 409 }
    );
  }

  const origin = request.nextUrl.origin;
  const uname  = unameTrimmed;

  // signUp — implicit flow ile çağrılır (PKCE gerektirmez).
  // Supabase, onay mailinde token_hash tabanlı link gönderir.
  // /auth/confirm sayfası verifyOtp ile doğrular — PKCE verifier sorununu ortadan kaldırır.
  const signUpClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false } }
  );
  const emailRedirectTo = `${origin}/auth/confirm`;
  const { data, error } = await signUpClient.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo,
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

  // Supabase zaten kayıtlı email için hata vermez, identities boş döner
  if (!data.user.identities || data.user.identities.length === 0) {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten kayıtlı." },
      { status: 409 }
    );
  }

  // Profil upsert (trigger yoksa da çalışsın)
  await adminClient.from("profiles").upsert(
    { id: data.user.id, username: uname },
    { onConflict: "id" }
  );

  return NextResponse.json({ ok: true });
}
