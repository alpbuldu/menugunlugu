"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

type Tab = "giris" | "kayit" | "sifre";

interface Props {
  defaultTab: Tab;
  from?: string;
  isNewAccount?: boolean;
}

export default function AuthForm({ defaultTab, from, isNewAccount }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Login state
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regUsername,       setRegUsername]       = useState("");
  const [regEmail,          setRegEmail]          = useState("");
  const [regPassword,       setRegPassword]       = useState("");
  const [regPassword2,      setRegPassword2]      = useState("");
  const [acceptKvkk,        setAcceptKvkk]        = useState(false);
  const [acceptMarketing,   setAcceptMarketing]   = useState(false);

  // Forgot password state
  const [resetEmail,   setResetEmail]   = useState("");

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
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email:    loginEmail.trim(),
      password: loginPassword,
    });

    setLoading(false);
    if (err || !data.user) {
      if (err?.message?.toLowerCase().includes("email not confirmed")) {
        setError("E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.");
      } else {
        setError("E-posta veya şifre hatalı.");
      }
      return;
    }

    // İlk giriş: URL'deki new=1 (email onay mailinden geldi) veya localStorage flag
    const isNewUser = isNewAccount || localStorage.getItem("mg_new_user") === "1";
    localStorage.removeItem("mg_new_user"); // Her başarılı girişte temizle

    // Önce sessionStorage'a bak (action bar goLogin() buraya yazar)
    let destination = "";
    try {
      const stored = sessionStorage.getItem("mg_login_return") ?? "";
      if (stored.startsWith("/") && !stored.startsWith("//")) {
        destination = stored;
        sessionStorage.removeItem("mg_login_return");
      }
    } catch {}

    // Fallback: URL param
    if (!destination) {
      const urlParams = new URLSearchParams(window.location.search);
      const rawFrom   = urlParams.get("from") ?? "";
      if (rawFrom.startsWith("/") && !rawFrom.startsWith("//")) destination = rawFrom;
    }

    if (destination) {
      window.location.href = destination;
    } else if (isNewUser) {
      window.location.href = "/uye/panel?tab=panelim";
    } else {
      window.location.href = "/uye/panel";
    }
  }

  // ── Forgot Password ────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const trimmedEmail = resetEmail.trim();

    // 1) Server: sadece kullanıcı varlık kontrolü
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      setError(data.error ?? "Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    // 2) Browser: PKCE verifier cookie tarayıcıda saklanır, sonra auth/callback okur
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/sifre-guncelle")}`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });

    setLoading(false);

    if (resetErr) {
      setError("Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setSuccess("Şifre sıfırlama linki e-postanıza gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.");
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
    if (!/^[a-z0-9_]{3,16}$/.test(regUsername.trim().toLowerCase())) {
      setError("Kullanıcı adı 3-16 karakter, sadece harf/rakam/alt çizgi olabilir.");
      return;
    }
    if (!acceptKvkk) {
      setError("Devam etmek için Kullanım Koşulları ve Aydınlatma Metni'ni kabul etmeniz gerekiyor.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:             regEmail.trim(),
        password:          regPassword,
        username:          regUsername.trim().toLowerCase(),
        marketing_consent: acceptMarketing,
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
    // İlk girişte Hesap Bilgilerim'e yönlendirmek için işaret bırak
    localStorage.setItem("mg_new_user", "1");
    setSuccess("Kayıt başarılı! 🎉 E-posta adresinize bir onay linki gönderdik. Gelen kutunuzu ve spam klasörünü kontrol edin.");
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
      {/* Şifremi Unuttum başlık (tab dışı) */}
      {tab === "sifre" && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-warm-100 bg-warm-50/50">
          <button
            onClick={() => { setTab("giris"); setError(""); setSuccess(""); }}
            className="text-warm-400 hover:text-warm-700 transition-colors"
            aria-label="Geri"
          >
            ←
          </button>
          <span className="text-sm font-medium text-warm-700">Şifremi Unuttum</span>
        </div>
      )}

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
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setTab("sifre"); setResetEmail(loginEmail); setError(""); setSuccess(""); }}
                className="text-xs text-warm-400 hover:text-brand-600 hover:underline transition-colors"
              >
                Şifremi unuttum
              </button>
            </div>
          </form>
        )}

        {/* ── Forgot password form ── */}
        {tab === "sifre" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-warm-500 leading-relaxed">
              Kayıtlı e-posta adresinizi girin. Şifre sıfırlama linki göndereceğiz.
            </p>
            <div>
              <label className={labelCls}>E-posta</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {loading ? "Gönderiliyor…" : "Sıfırlama Linki Gönder"}
            </button>
            <button
              type="button"
              onClick={() => { setTab("giris"); setError(""); setSuccess(""); }}
              className="w-full py-2 text-sm text-warm-500 hover:text-warm-700 transition-colors"
            >
              ← Giriş sayfasına dön
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
                maxLength={16}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-warm-400">
                3-16 karakter, harf/rakam/alt çizgi
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

            {/* ── KVKK & Legal Checkboxes ── */}
            <div className="space-y-3 pt-1 border-t border-warm-100">
              {/* Aydınlatma Metni link */}
              <a
                href="/aydinlatma-metni"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-brand-600 hover:text-brand-800 underline transition-colors mt-3"
              >
                Aydınlatma Metni'ni okumak için tıklayın →
              </a>

              {/* Required: KVKK + Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <span
                  onClick={() => setAcceptKvkk(!acceptKvkk)}
                  className={[
                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                    acceptKvkk
                      ? "bg-brand-500 border-brand-500"
                      : "bg-white border-warm-300 hover:border-brand-400",
                  ].join(" ")}
                >
                  {acceptKvkk && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-warm-600 leading-relaxed">
                  <a href="/kullanim-kosullari" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">Kullanım Koşulları</a>'nı
                  {" "}ve{" "}
                  <a href="/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">Kişisel Verilerin Korunması Politikası</a>'nı
                  {" "}kabul ediyor ve kişisel verilerimin Aydınlatma Metni'nde belirtilen kapsam ve amaçlar doğrultusunda yurt dışına aktarılmasına izin veriyorum.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              {/* Optional: Marketing */}
              <label className="flex items-start gap-3 cursor-pointer">
                <span
                  onClick={() => setAcceptMarketing(!acceptMarketing)}
                  className={[
                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                    acceptMarketing
                      ? "bg-brand-500 border-brand-500"
                      : "bg-white border-warm-300 hover:border-brand-400",
                  ].join(" ")}
                >
                  {acceptMarketing && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-warm-500 leading-relaxed">
                  Bana özel hazırlanmış veya benim için geçerli olan pazarlama faaliyetleri hakkında e-posta almak istiyorum.
                </span>
              </label>
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
