"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { AdminProfile } from "@/lib/types";

const BUCKET = "recipes"; // reuse existing bucket with admin/ prefix

export default function AdminProfileForm({ profile }: { profile: AdminProfile }) {
  const [username,   setUsername]   = useState(profile.username);
  const [avatarUrl,  setAvatarUrl]  = useState(profile.avatar_url ?? "");
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setUploading(false);
    if (!res.ok) {
      setMessage("Görsel yükleme başarısız.");
      return;
    }
    setAvatarUrl(data.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username:   username.trim(),
        avatar_url: avatarUrl || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("✅ Profil güncellendi.");
    } else {
      const d = await res.json();
      setMessage(`Hata: ${d.error}`);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-3">
          Profil Görseli
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-warm-100 border border-warm-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? "Yükleniyor…" : "Görsel Seç"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="block text-xs text-red-500 hover:underline"
              >
                Görseli kaldır
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Görünen Ad
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Menü Günlüğü"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-warm-400">
          Tariflerin altında yazar olarak görünecek isim
        </p>
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
