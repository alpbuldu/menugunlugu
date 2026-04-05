"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => { if (r.ok) router.replace(from); })
      .catch(() => {});
  }, [from, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error ?? "Giriş başarısız.");
      }
    } catch {
      setError("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-warm-900">Menü Günlüğü</h1>
          <p className="text-warm-500 text-sm mt-1">Admin Paneline Giriş</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-warm-700 mb-1.5"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin şifrenizi girin"
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-warm-900 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-shadow text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-warm-400 mt-6">
          <a href="/" className="hover:text-warm-600 transition-colors">
            ← Siteye dön
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
