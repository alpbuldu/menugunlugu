"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PasswordUpdateForm() {
  const router = useRouter();
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [ready,     setReady]     = useState(false);

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
  const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

  useEffect(() => {
    // Supabase, reset linkindeki token'ı otomatik olarak oturuma çevirir.
    // onAuthStateChange ile PASSWORD_RECOVERY event'ini yakala.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Zaten oturum açıksa (sayfa yenilemesi) kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError("Şifre güncellenemedi. Link süresi dolmuş olabilir, lütfen tekrar şifre sıfırlama isteği gönderin.");
      return;
    }

    setSuccess("Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz…");
    setTimeout(() => router.push("/giris"), 2000);
  }

  if (!ready) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 text-center">
        <div className="text-warm-400 text-sm">Doğrulanıyor…</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Yeni Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="En az 6 karakter"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Yeni Şifre (tekrar)</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
          >
            {loading ? "Güncelleniyor…" : "Şifremi Güncelle"}
          </button>
        </form>
      )}
    </div>
  );
}
