"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernameForm({ currentUsername }: { currentUsername: string }) {
  const [username, setUsername] = useState(currentUsername);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const router = useRouter();

  const changed = username !== currentUsername && username.length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;
    setSaving(true); setError(""); setSuccess("");

    const res  = await fetch("/api/member/username", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Güncelleme başarısız."); return; }
    setSuccess("Kullanıcı adı güncellendi.");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-6">
      <h2 className="text-sm font-semibold text-warm-700 mb-4">Kullanıcı Adı</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              setError(""); setSuccess("");
            }}
            placeholder="kullanici_adi"
            minLength={3}
            maxLength={30}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 text-warm-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
          <p className="text-xs text-warm-400 mt-1.5">
            Sadece küçük harf, rakam ve _ — en az 3 karakter
          </p>
        </div>
        <button
          type="submit"
          disabled={!changed || saving}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start"
        >
          {saving ? "Kaydediliyor…" : "Değiştir"}
        </button>
      </form>
      {error   && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {success && <p className="text-xs text-green-600 mt-2">✓ {success}</p>}
    </div>
  );
}
