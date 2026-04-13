import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as EmailOtpType | null;
  const code       = searchParams.get("code");
  const next       = searchParams.get("next") ?? "/uye/panel";
  const origin     = new URL(request.url).origin;

  try {
    const supabase = await createClient();

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        // After email confirmation, redirect to login with success message
        if (type === "signup" || type === "email") {
          return NextResponse.redirect(`${origin}/giris?mesaj=email-onaylandi`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  } catch {
    // fallthrough
  }

  return NextResponse.redirect(`${origin}/giris?mesaj=onay-hatasi`);
}
