"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

type Tab = "giris" | "kayit";

interface Props {
  defaultTab: Tab;
  from?: string;
}

export default function AuthForm({ defaultTab, from }: Props) {
  const router  = useRouter();
  const [tab,   setTab]   = useState<Tab>(defaultTab);

  // Login state
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
  const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

  // ── Login ──────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email:    loginEmail.trim(),
      password: loginPassword,
    });

    setLoading(false);
    if (err) {
      setError("E-posta veya şifre hatalı.");
      return;
    }

    router.push(from ?? "/uye/panel");
    router.refresh();
  }

  // ── Register ───────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (regPassword !== regPassword2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(regUsername.trim().toLowerCase())) {
      setError("Kullanıcı adı 3-20 karakter, sadece harf/rakam/alt çizgi olabilir.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:    regEmail.trim(),
        password: regPassword,
        username: regUsername.trim().toLowerCase(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Kayıt sırasında hata oluştu.");
      return;
    }

    setLoading(false);
    // Mail onayı gerekiyor — otomatik giriş yapma, kullanıcıya bildir
    setSuccess("Kayıt başarılı! 🎉 E-posta adresinize bir onay linki gönderdik. Linke tıkladıktan sonra giriş yapabilirsiniz.");
    setTab("giris");
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-warm-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-warm-100">
        {(["giris", "kayit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); setSuccess(""); }}
            className={clsx(
              "flex-1 py-3.5 text-sm font-medium transition-colors",
              tab === t
                ? "text-brand-700 border-b-2 border-brand-500 bg-brand-50/50"
                : "text-warm-500 hover:text-warm-700 hover:bg-warm-50"
            )}
          >
            {t === "giris" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Error / success */}
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

        {/* ── Login form ── */}
        {tab === "giris" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelCls}>E-posta</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Şifre</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        )}

        {/* ── Register form ── */}
        {tab === "kayit" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelCls}>Kullanıcı Adı</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="ahmet_yemek"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-warm-400">
                3-20 karakter, harf/rakam/alt çizgi
              </p>
            </div>
            <div>
              <label className={labelCls}>E-posta</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Şifre</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="En az 6 karakter"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Şifre (tekrar)</label>
              <input
                type="password"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
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
              {loading ? "Kayıt yapılıyor…" : "Kayıt Ol"}
            </button>
          </form>
        )}

        {/* Switch tab hint */}
        <p className="mt-5 text-center text-xs text-warm-400">
          {tab === "giris" ? (
            <>Hesabın yok mu?{" "}
              <button onClick={() => setTab("kayit")} className="text-brand-600 hover:underline font-medium">
                Kayıt ol
              </button>
            </>
          ) : (
            <>Zaten üye misin?{" "}
              <button onClick={() => setTab("giris")} className="text-brand-600 hover:underline font-medium">
                Giriş yap
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
