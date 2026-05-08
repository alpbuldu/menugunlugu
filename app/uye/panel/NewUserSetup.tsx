"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserSetup() {
  const [username, setUsername] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setSaving(true); setError("");

    const res = await fetch("/api/member/username", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username: username.trim() }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Kullanıcı adı kaydedilemedi."); return; }
    router.replace("/uye/panel?tab=panelim");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🍽️</div>
          <h2 className="text-xl font-bold text-warm-900">Hoş geldin!</h2>
          <p className="text-sm text-warm-500 mt-1">
            Devam etmek için bir kullanıcı adı belirle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                setError("");
              }}
              placeholder="kullanici_adi"
              minLength={3}
              maxLength={16}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-warm-200 text-warm-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
            <p className="text-xs text-warm-400 mt-1.5">
              3-16 karakter · küçük harf, rakam, alt çizgi
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving || username.length < 3}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {saving ? "Kaydediliyor…" : "Devam Et"}
          </button>
        </form>
      </div>
    </div>
  );
}
