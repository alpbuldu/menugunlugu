"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "confirmed" | "error";

export default function ConfirmPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [state, setState] = useState<State>("loading");

  // Login form
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [logging,  setLogging]  = useState(false);

  useEffect(() => {
    async function confirm() {
      const supabase   = createClient();
      const token_hash = params.get("token_hash");
      const type       = params.get("type");
      const code       = params.get("code");
      const logout     = params.get("logout") === "1";

      if (token_hash && type) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash });
        if (!error) {
          if (logout) await supabase.auth.signOut();
          else await supabase.auth.signOut(); // email onayı — her zaman çıkış yap
          setState("confirmed");
          return;
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          await supabase.auth.signOut(); // email onayı — her zaman çıkış yap
          setState("confirmed");
          return;
        }
      }

      setState("error");
      setTimeout(() => router.replace("/giris?mesaj=onay-hatasi"), 2500);
    }

    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    setLogging(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error || !data.user) {
      setLoginErr("E-posta veya şifre hatalı.");
      setLogging(false);
      return;
    }

    // mg_new_user bayrağını temizle — confirm sayfasından giriş yapılırken silinmezse
    // sonraki normal girişlerde de yanlış yönlendirme yapılıyor
    localStorage.removeItem("mg_new_user");

    // İlk giriş: profilde full_name yoksa Hesap Bilgilerim'e yönlendir
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    if (!profile?.full_name) {
      router.replace("/uye/panel?tab=panelim");
    } else {
      router.replace("/uye/panel");
    }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm";

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <p className="text-3xl mb-3">🍽️</p>
          <p className="text-warm-500 text-sm animate-pulse">Hesabınız doğrulanıyor…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-warm-600 text-sm">Bağlantı geçersiz veya süresi dolmuş.</p>
          <p className="text-warm-400 text-xs mt-1">Giriş sayfasına yönlendiriliyorsunuz…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-sm">
        {/* Başarı banner */}
        <div className="mb-6 px-5 py-4 rounded-2xl bg-green-50 border border-green-200 text-center">
          <p className="text-2xl mb-1">✅</p>
          <p className="font-semibold text-green-800 text-sm">Hesabınız doğrulandı!</p>
          <p className="text-green-600 text-xs mt-1">Şimdi giriş yapabilirsiniz.</p>
        </div>

        {/* Login formu */}
        <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6">
          <h2 className="text-base font-semibold text-warm-900 mb-4">Giriş Yap</h2>

          {loginErr && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {loginErr}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={logging}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {logging ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
