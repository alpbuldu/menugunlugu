"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router      = useRouter();
  const params      = useSearchParams();
  const [msg, setMsg] = useState("Hesabınız doğrulanıyor…");

  useEffect(() => {
    async function confirm() {
      const supabase   = createClient();
      const token_hash = params.get("token_hash");
      const type       = params.get("type");
      const code       = params.get("code");

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: type as any,
          token_hash,
        });
        if (!error) {
          router.replace("/uye/panel");
          return;
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/uye/panel");
          return;
        }
      }

      setMsg("Bağlantı geçersiz veya süresi dolmuş.");
      setTimeout(() => router.replace("/giris?mesaj=onay-hatasi"), 2000);
    }

    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <p className="text-2xl mb-3">🍽️</p>
        <p className="text-warm-600 text-sm">{msg}</p>
      </div>
    </div>
  );
}
