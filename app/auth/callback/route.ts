import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase PKCE auth callback.
 * E-posta onayı ve şifre sıfırlama linkleri buraya gelir,
 * `code` parametresi session'a çevrilir, ardından `next` URL'ye yönlendirilir.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code   = searchParams.get("code");
  const next   = searchParams.get("next") ?? "/";
  const logout = searchParams.get("logout") === "1";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.error("[auth/callback] exchangeCodeForSession result:", error ? `ERROR: ${error.message}` : "OK");

    if (!error) {
      // logout=1 → e-posta onayı akışı: session kur, hemen çıkış yap
      // Kullanıcı login formunu doldurmak zorunda kalır → mg_new_user flag çalışır
      if (logout) {
        await supabase.auth.signOut();
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Hata → giriş sayfasına yönlendir
  return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
}
