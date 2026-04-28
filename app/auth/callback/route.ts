import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (logout) await supabase.auth.signOut();
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
