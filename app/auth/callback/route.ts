import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase auth callback — PKCE code exchange.
 * resetPasswordForEmail tarayıcı tarafında çağrılır; verifier cookie'de saklanır.
 * Bu route server-side olarak verifier'ı cookie'den okur, code'u exchange eder.
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

    if (!error) {
      if (logout) await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Server-side exchange başarısız → browser-side /auth/confirm'e yönlendir.
    // Tarayıcı kendi cookie/storage'ındaki PKCE verifier ile yeniden dener.
    const confirmUrl = new URL("/auth/confirm", origin);
    confirmUrl.searchParams.set("code", code);
    if (logout) confirmUrl.searchParams.set("logout", "1");
    if (next && next !== "/") confirmUrl.searchParams.set("next", next);
    return NextResponse.redirect(confirmUrl);
  }

  return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
}
