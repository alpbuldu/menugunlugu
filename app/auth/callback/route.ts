import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase auth callback — PKCE olmadan exchange (implicit flow override).
 * resetPasswordForEmail implicit flow ile çağrıldığında code_challenge yoktur;
 * bu nedenle exchange da verifier gerektirmez.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code   = searchParams.get("code");
  const next   = searchParams.get("next") ?? "/";
  const logout = searchParams.get("logout") === "1";

  if (code) {
    const cookieStore = await cookies();

    // flowType: 'implicit' override → exchangeCodeForSession verifier aramaz
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { flowType: "implicit" },
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
    console.error("[auth/callback] exchange result:", error ? `ERROR: ${error.message}` : "OK");

    if (!error) {
      if (logout) await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
}
