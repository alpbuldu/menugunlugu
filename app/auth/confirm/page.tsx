"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function confirm() {
      const supabase   = createClient();
      const token_hash = params.get("token_hash");
      const type       = params.get("type");
      const code       = params.get("code");

      // token_hash tabanlı doğrulama
      if (token_hash) {
        // signup/email → 'email' olarak gönder; recovery/invite olduğu gibi geçer
        const otpType = (type === "signup" || !type) ? "email" : type;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.auth.verifyOtp({ type: otpType as any, token_hash });
        if (!error) {
          if (type === "recovery") {
            // Şifre sıfırlama — oturumu koru, şifre güncelleme sayfasına git
            router.replace("/sifre-guncelle");
          } else {
            // E-posta onayı — oturumu kapat, giriş sayfasına yönlendir
            await supabase.auth.signOut();
            router.replace("/giris?mesaj=email-onaylandi&new=1");
          }
          return;
        }
      }

      // code tabanlı doğrulama (PKCE fallback — şifre sıfırlama için)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // code akışı şifre sıfırlama için kullanılır → /sifre-guncelle
          if (type === "recovery") {
            router.replace("/sifre-guncelle");
          } else {
            await supabase.auth.signOut();
            router.replace("/giris?mesaj=email-onaylandi&new=1");
          }
          return;
        }
      }

      // Doğrulama başarısız
      router.replace("/giris?mesaj=onay-hatasi");
    }

    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <p className="text-3xl mb-3">🍽️</p>
        <p className="text-warm-500 text-sm animate-pulse">E-posta adresiniz doğrulanıyor…</p>
      </div>
    </div>
  );
}
