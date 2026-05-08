import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase auth callback.
 *
 * İki akış desteklenir:
 * 1. token_hash + type  → implicit flow e-posta onayı (kayıt sonrası)
 * 2. code               → PKCE flow (şifre sıfırlama vb.)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type      = searchParams.get("type");
  const code      = searchParams.get("code");
  const next      = searchParams.get("next") ?? "/";
  const logout    = searchParams.get("logout") === "1";
  const from      = searchParams.get("from"); // "login" | "register" | null

  // ── 1. Implicit flow: token_hash tabanlı e-posta doğrulaması ──────────────
  if (tokenHash && type) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    if (!error) {
      if (logout) await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
  }

  // ── 2. PKCE flow: code exchange ───────────────────────────────────────────
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

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[auth/callback] exchangeCodeForSession result:", {
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.user,
      error: error ? { message: error.message, status: error.status } : null,
      cookieNames: cookieStore.getAll().map(c => c.name),
    });

    if (!error) {
      if (logout) await supabase.auth.signOut();

      // Google OAuth: yeni kullanıcıysa profil kurulum sayfasına yönlendir
      if (sessionData?.user && next === "/uye/panel") {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profile } = await admin
          .from("profiles")
          .select("username")
          .eq("id", sessionData.user.id)
          .single();
        if (!profile?.username) {
          // Login tabından geldiyse → hesap yok mesajı ver
          if (from === "login") {
            return NextResponse.redirect(`${origin}/giris?mesaj=google-hesap-yok&tab=kayit`);
          }
          // Register tabından geldiyse → kullanıcı adı kur
          return NextResponse.redirect(`${origin}/uye/panel?tab=panelim&yeni=1`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    // Server-side exchange başarısız → browser-side /auth/confirm'e yönlendir.
    const confirmUrl = new URL("/auth/confirm", origin);
    confirmUrl.searchParams.set("code", code);
    if (logout) confirmUrl.searchParams.set("logout", "1");
    if (next && next !== "/") confirmUrl.searchParams.set("next", next);
    return NextResponse.redirect(confirmUrl);
  }

  return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
}
