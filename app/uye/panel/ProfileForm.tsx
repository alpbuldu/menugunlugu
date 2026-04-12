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
              { label: "📸 Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/kullanici" },
              { label: "🐦 X / Twitter", value: twitter, set: setTwitter, placeholder: "https://x.com/kullanici" },
              { label: "▶️ YouTube", value: youtube, set: setYoutube, placeholder: "https://youtube.com/@kanal" },
              { label: "🌐 Web Site", value: website, set: setWebsite, placeholder: "https://siteniz.com" },
            ].map((f) => (
              <div key={f.label}>
                <label className={labelCls}>{f.label}</label>
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
