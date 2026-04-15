"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  profile: {
    full_name: string | null;
    bio: string | null;
    instagram: string | null;
    twitter: string | null;
    youtube: string | null;
    website: string | null;
  };
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 text-warm-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white";
const labelCls = "block text-xs font-medium text-warm-600 mb-1";

export default function ProfileForm({ profile }: Props) {
  const [fullName,   setFullName]   = useState(profile.full_name   ?? "");
  const [bio,        setBio]        = useState(profile.bio         ?? "");
  const [instagram,  setInstagram]  = useState(profile.instagram   ?? "");
  const [twitter,    setTwitter]    = useState(profile.twitter     ?? "");
  const [youtube,    setYoutube]    = useState(profile.youtube     ?? "");
  const [website,    setWebsite]    = useState(profile.website     ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");

    const res = await fetch("/api/member/profile", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ full_name: fullName, bio, instagram, twitter, youtube, website }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Güncelleme başarısız."); return; }
    setSuccess("Profil güncellendi.");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-6">
      <h2 className="text-sm font-semibold text-warm-700 mb-5">Profil Bilgileri</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ad Soyad */}
        <div>
          <label className={labelCls}>Ad Soyad</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız" className={inputCls} />
        </div>

        {/* Bio */}
        <div>
          <label className={labelCls}>Hakkımda</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            rows={2} maxLength={200} placeholder="Kendinizi kısaca tanıtın…"
            className={`${inputCls} resize-none`} />
          <p className="text-xs text-warm-300 text-right mt-1">{bio.length}/200</p>
        </div>

        {/* Sosyal medya */}
        <div className="border-t border-warm-100 pt-4">
          <p className="text-xs font-semibold text-warm-500 mb-3">Sosyal Medya</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: "Instagram", icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" /></svg>
                ), value: instagram, set: setInstagram, placeholder: "https://instagram.com/kullanici",
              },
              {
                label: "X / Twitter", icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.903-5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                ), value: twitter, set: setTwitter, placeholder: "https://x.com/kullanici",
              },
              {
                label: "YouTube", icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" /></svg>
                ), value: youtube, set: setYoutube, placeholder: "https://youtube.com/@kanal",
              },
              {
                label: "TikTok", icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" /></svg>
                ), value: website, set: setWebsite, placeholder: "https://tiktok.com/@hesap",
              },
            ].map((f) => (
              <div key={f.label}>
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  <span className="text-warm-400">{f.icon}</span>
                  {f.label}
                </label>
                <input type="url" value={f.value} onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors">
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {error   && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-600">✓ {success}</p>}
        </div>
      </form>
    </div>
  );
}
