"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

type Tab = "giris" | "kayit" | "sifre";

interface Props {
  defaultTab: Tab;
  from?: string;
  isNewAccount?: boolean;
  topMesaj?: "email-onaylandi" | "onay-hatasi" | "deleted" | null;
}

export default function AuthForm({ defaultTab, from, isNewAccount, topMesaj }: Props) {
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

  const [loading,       setLoading]       = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
  const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

  // ── Google OAuth ───────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError("");
    setSocialLoading(true);
    const supabase = createClient();
    // Eski/geçersiz session cookie'lerini temizle (silinmiş hesap tekrar kayıt için)
    await supabase.auth.signOut();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/uye/panel`,
      },
    });
    if (err) {
      setSocialLoading(false);
      setError("Google ile giriş yapılamadı. Lütfen tekrar deneyin.");
    }
    // Başarılıysa tarayıcı Google'a yönlenir, loading state'i resetlemeye gerek yok
  }

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
        return;
      }
      // Genel hata — ikinci ağ isteği olmadan, güvenli ve hızlı
      setError("E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.");
      return;
    }

    localStorage.removeItem("mg_new_user");

    // İlk giriş tespiti: URL ?new=1 VEYA user_metadata.first_login (cross-device güvenilir)
    const isFirst = isNewAccount || data.user.user_metadata?.first_login === true;
    if (isFirst) {
      // Metadata'dan temizle (fire-and-forget)
      supabase.auth.updateUser({ data: { first_login: false } }).catch(() => {});
      window.location.href = "/uye/panel?tab=panelim";
      return;
    }

    // Geri dönüş adresi — sessionStorage (action bar) veya URL ?from=
    let destination = "";
    try {
      const stored = sessionStorage.getItem("mg_login_return") ?? "";
      if (stored.startsWith("/") && !stored.startsWith("//")) {
        destination = stored;
        sessionStorage.removeItem("mg_login_return");
      }
    } catch {}
    if (!destination) {
      const urlParams = new URLSearchParams(window.location.search);
      const rawFrom   = urlParams.get("from") ?? "";
      if (rawFrom.startsWith("/") && !rawFrom.startsWith("//")) {
        destination = rawFrom;
      }
    }

    window.location.href = destination || "/uye/panel";
  }

  // ── Forgot Password ────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const trimmedEmail = resetEmail.trim();

    // 1) Server: rate limit'siz kullanıcı varlık kontrolü
    const checkRes = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    if (!checkRes.ok) {
      const d = await checkRes.json().catch(() => ({}));
      setLoading(false);
      setError((d as { error?: string }).error ?? "Şifre sıfırlama e-postası gönderilemedi.");
      return;
    }

    // 2) Tarayıcıdan resetPasswordForEmail → Supabase Brevo SMTP ile gönderir,
    // PKCE verifier browser cookie'sine yazılır.
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/sifre-guncelle")}`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      { redirectTo }
    );

    setLoading(false);

    if (resetErr) {
      const msg = resetErr.message ?? "";
      if (msg.toLowerCase().includes("security purposes") || msg.toLowerCase().includes("after")) {
        setError("Lütfen 1 dakika bekleyip tekrar deneyin.");
      } else {
        setError("Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.");
      }
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
      {/* Üst mesaj (email onay / hata / silindi) */}
      {topMesaj === "email-onaylandi" && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-100 text-green-700 text-sm text-center font-medium">
          ✅ E-posta adresiniz onaylandı, giriş yapabilirsiniz.
        </div>
      )}
      {topMesaj === "onay-hatasi" && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm text-center">
          Onay linki geçersiz veya süresi dolmuş. Lütfen tekrar kayıt olmayı deneyin.
        </div>
      )}
      {topMesaj === "deleted" && (
        <div className="px-6 py-3 bg-orange-50 border-b border-orange-100 text-orange-700 text-sm text-center">
          Hesabınız silinmiş. Lütfen tekrar kayıt olun.
        </div>
      )}

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

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-warm-200" />
              <span className="text-xs text-warm-400 font-medium">veya</span>
              <div className="flex-1 h-px bg-warm-200" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 disabled:opacity-60 text-warm-800 font-medium text-sm transition-colors"
            >
              <GoogleIcon />
              {socialLoading ? "Yönlendiriliyor…" : "Google ile devam et"}
            </button>
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

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-warm-200" />
              <span className="text-xs text-warm-400 font-medium">veya</span>
              <div className="flex-1 h-px bg-warm-200" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 disabled:opacity-60 text-warm-800 font-medium text-sm transition-colors"
            >
              <GoogleIcon />
              {socialLoading ? "Yönlendiriliyor…" : "Google ile devam et"}
            </button>
          </form>
        )}

        {/* Switch tab hint */}
        <p className="mt-4 text-center text-xs text-warm-400">
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
