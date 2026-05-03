"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { AdminProfile } from "@/lib/types";

export default function AdminProfileForm({ profile }: { profile: AdminProfile }) {
  const [username,      setUsername]      = useState(profile.username);
  const [avatarUrl,     setAvatarUrl]     = useState(profile.avatar_url ?? "");
  const [fullName,      setFullName]      = useState((profile as any).full_name  ?? "");
  const [bio,           setBio]           = useState((profile as any).bio        ?? "");
  const [instagram,     setInstagram]     = useState((profile as any).instagram  ?? "");
  const [twitter,       setTwitter]       = useState((profile as any).twitter    ?? "");
  const [youtube,       setYoutube]       = useState((profile as any).youtube    ?? "");
  const [website,       setWebsite]       = useState((profile as any).website    ?? "");
  const [commentUserId, setCommentUserId] = useState((profile as any).comment_user_id ?? "");
  const [commentUname,  setCommentUname]  = useState("");
  const [lookingUp,     setLookingUp]     = useState(false);
  const [lookupMsg,     setLookupMsg]     = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm";
  const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setMessage("Görsel yükleme başarısız."); return; }
    setAvatarUrl(data.url);
  }

  async function handleLookup() {
    if (!commentUname.trim()) return;
    setLookingUp(true); setLookupMsg("");
    const res  = await fetch(`/api/admin/users/lookup?username=${encodeURIComponent(commentUname.trim())}`);
    const data = await res.json();
    setLookingUp(false);
    if (!res.ok || !data.id) {
      setLookupMsg(`❌ "${commentUname}" bulunamadı.`);
    } else {
      setCommentUserId(data.id);
      setLookupMsg(`✅ ${data.username} (${data.id.slice(0, 8)}…)`);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage("");
    const res = await fetch("/api/admin/profil", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        username:        username.trim(),
        avatar_url:      avatarUrl || null,
        full_name:       fullName.trim()  || null,
        bio:             bio.trim()       || null,
        instagram:       instagram.trim() || null,
        twitter:         twitter.trim()   || null,
        youtube:         youtube.trim()   || null,
        website:         website.trim()   || null,
        comment_user_id: commentUserId    || null,
      }),
    });
    setSaving(false);
    if (res.ok) setMessage("✅ Profil güncellendi.");
    else { const d = await res.json(); setMessage(`Hata: ${d.error}`); }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      {/* Avatar */}
      <div>
        <label className={labelCls}>Profil Görseli</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-warm-100 border border-warm-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50">
              {uploading ? "Yükleniyor…" : "Görsel Seç"}
            </button>
            {avatarUrl && (
              <button type="button" onClick={() => setAvatarUrl("")}
                className="block text-xs text-red-500 hover:underline">
                Görseli kaldır
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Görünen Ad */}
      <div>
        <label className={labelCls}>Görünen Ad <span className="text-red-400">*</span></label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
          required placeholder="Menü Günlüğü" className={inputCls} />
        <p className="mt-1 text-xs text-warm-400">Tariflerin altında yazar olarak görünecek isim</p>
      </div>

      {/* Ad Soyad */}
      <div>
        <label className={labelCls}>Ad Soyad</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
          placeholder="Adınız Soyadınız" className={inputCls} />
      </div>

      {/* Bio */}
      <div>
        <label className={labelCls}>Tanıtım Metni</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
          rows={3} maxLength={300} placeholder="Kendinizi ve sitenizi kısaca tanıtın…"
          className={`${inputCls} resize-none`} />
        <p className="text-xs text-warm-300 text-right mt-1">{bio.length}/300</p>
      </div>

      {/* Sosyal medya */}
      <div className="border-t border-warm-100 pt-4">
        <p className="text-sm font-medium text-warm-700 mb-4">Sosyal Medya</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "📸 Instagram", value: instagram, set: setInstagram, ph: "https://instagram.com/hesap" },
            { label: "🐦 X / Twitter", value: twitter, set: setTwitter,   ph: "https://x.com/hesap" },
            { label: "▶️ YouTube",   value: youtube,  set: setYoutube,   ph: "https://youtube.com/@kanal" },
            { label: "🎵 TikTok",    value: website,  set: setWebsite,   ph: "https://tiktok.com/@hesap" },
          ].map((f) => (
            <div key={f.label}>
              <label className={labelCls}>{f.label}</label>
              <input type="url" value={f.value} onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Yorum Hesabı */}
      <div className="border-t border-warm-100 pt-4">
        <label className={labelCls}>💬 Admin Yorum Hesabı</label>
        <p className="text-xs text-warm-400 mb-3">
          Admin panelinden yorum yazarken hangi üye hesabıyla yayınlanacağını belirler.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentUname}
            onChange={e => setCommentUname(e.target.value)}
            placeholder="Kullanıcı adı (örn: hikayeliyemekler)"
            className={`${inputCls} flex-1`}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleLookup())}
          />
          <button type="button" onClick={handleLookup} disabled={lookingUp || !commentUname.trim()}
            className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
            {lookingUp ? "…" : "Bul"}
          </button>
        </div>
        {lookupMsg && (
          <p className={`mt-1.5 text-xs ${lookupMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
            {lookupMsg}
          </p>
        )}
        {commentUserId && !lookupMsg && (
          <p className="mt-1.5 text-xs text-warm-400">
            Mevcut: <span className="font-mono">{commentUserId.slice(0, 16)}…</span>
          </p>
        )}
        {commentUserId && (
          <button type="button" onClick={() => { setCommentUserId(""); setLookupMsg(""); }}
            className="mt-1 text-xs text-red-400 hover:underline">
            Temizle
          </button>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button type="submit" disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors">
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
