"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface SiteSettings {
  logo_url:         string | null;
  favicon_url:      string | null;
  contact_email:    string | null;
  instagram_url:    string | null;
  youtube_url:      string | null;
  tiktok_url:       string | null;
  twitter_url:      string | null;
  adsense_enabled:  boolean | null;
  popup_image_url:  string | null;
  popup_link_url:   string | null;
  popup_is_active:  boolean | null;
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm";
const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

export default function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [logoUrl,         setLogoUrl]         = useState(settings.logo_url         ?? "");
  const [faviconUrl,      setFaviconUrl]       = useState(settings.favicon_url      ?? "");
  const [email,           setEmail]            = useState(settings.contact_email    ?? "");
  const [instagram,       setInstagram]        = useState(settings.instagram_url    ?? "");
  const [youtube,         setYoutube]          = useState(settings.youtube_url      ?? "");
  const [tiktok,          setTiktok]           = useState(settings.tiktok_url       ?? "");
  const [twitter,         setTwitter]          = useState(settings.twitter_url      ?? "");
  const [adsenseEnabled,  setAdsenseEnabled]   = useState(settings.adsense_enabled  ?? false);
  const [popupImageUrl,   setPopupImageUrl]    = useState(settings.popup_image_url  ?? "");
  const [popupLinkUrl,    setPopupLinkUrl]     = useState(settings.popup_link_url   ?? "");
  const [popupIsActive,   setPopupIsActive]    = useState(settings.popup_is_active  ?? false);
  const [uploadingLogo,    setUploadingLogo]    = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingPopup,   setUploadingPopup]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState("");

  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const popupRef   = useRef<HTMLInputElement>(null);

  async function upload(file: File, setUrl: (u: string) => void, setLoading: (b: boolean) => void) {
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setUrl(data.url);
    else setMessage("Görsel yüklenemedi.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage("");
    const res = await fetch("/api/admin/site-ayarlari", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logo_url:         logoUrl              || null,
        favicon_url:      faviconUrl           || null,
        contact_email:    email.trim()         || null,
        instagram_url:    instagram.trim()     || null,
        youtube_url:      youtube.trim()       || null,
        tiktok_url:       tiktok.trim()        || null,
        twitter_url:      twitter.trim()       || null,
        adsense_enabled:  adsenseEnabled,
        popup_image_url:  popupImageUrl        || null,
        popup_link_url:   popupLinkUrl.trim()  || null,
        popup_is_active:  popupIsActive,
      }),
    });
    setSaving(false);
    if (res.ok) setMessage("✅ Ayarlar kaydedildi.");
    else { const d = await res.json(); setMessage(`Hata: ${d.error}`); }
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-8">

      {/* Logo */}
      <div className="border border-warm-200 rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-warm-800">🖼️ Logo</h2>

        {/* OG Logo (arka planlı) */}
        <div>
          <label className={labelCls}>OG / Sosyal Medya Logosu <span className="text-xs text-warm-400">(arka planlı)</span></label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-warm-200 bg-warm-50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {logoUrl
                ? <Image src={logoUrl} alt="Logo" width={96} height={96} className="object-contain w-full h-full" />
                : <span className="text-3xl">🍽️</span>}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setLogoUrl, setUploadingLogo); }} />
              <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50">
                {uploadingLogo ? "Yükleniyor…" : logoUrl ? "Değiştir" : "Yükle"}
              </button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="block text-xs text-red-500 hover:underline mt-1.5">Kaldır</button>}
              <p className="text-xs text-warm-400 mt-1.5">OG image, sosyal paylaşım önizlemesi</p>
            </div>
          </div>
        </div>

        {/* Favicon (arka plansız) */}
        <div>
          <label className={labelCls}>Favicon / Site İkonu <span className="text-xs text-warm-400">(şeffaf arka plan)</span></label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-warm-200 bg-warm-800 overflow-hidden flex items-center justify-center flex-shrink-0">
              {faviconUrl
                ? <Image src={faviconUrl} alt="Favicon" width={96} height={96} className="object-contain w-full h-full" />
                : <span className="text-3xl">🍽️</span>}
            </div>
            <div>
              <input ref={faviconRef} type="file" accept="image/png,image/svg+xml" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setFaviconUrl, setUploadingFavicon); }} />
              <button type="button" onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}
                className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50">
                {uploadingFavicon ? "Yükleniyor…" : faviconUrl ? "Değiştir" : "Yükle"}
              </button>
              {faviconUrl && <button type="button" onClick={() => setFaviconUrl("")} className="block text-xs text-red-500 hover:underline mt-1.5">Kaldır</button>}
              <p className="text-xs text-warm-400 mt-1.5">PNG veya SVG — tarayıcı sekmesi ikonu</p>
            </div>
          </div>
        </div>
      </div>

      {/* İletişim */}
      <div className="border border-warm-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-warm-800">✉️ İletişim</h2>
        <div>
          <label className={labelCls}>E-posta Adresi</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="info@menugunlugu.com" className={inputCls} />
        </div>
      </div>

      {/* Sosyal Medya */}
      <div className="border border-warm-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-warm-800">📱 Sosyal Medya</h2>
        {[
          { label: "📸 Instagram", value: instagram, set: setInstagram, ph: "https://www.instagram.com/menugunlugu/" },
          { label: "▶️ YouTube",   value: youtube,   set: setYoutube,   ph: "https://youtube.com/@menugunlugu" },
          { label: "🎵 TikTok",    value: tiktok,    set: setTiktok,    ph: "https://www.tiktok.com/@menugunlugu" },
          { label: "𝕏 X",         value: twitter,   set: setTwitter,   ph: "https://x.com/menugunlugu" },
        ].map((f) => (
          <div key={f.label}>
            <label className={labelCls}>{f.label}</label>
            <input type="url" value={f.value} onChange={(e) => f.set(e.target.value)}
              placeholder={f.ph} className={inputCls} />
          </div>
        ))}
      </div>

      {/* Popup */}
      <div className="border border-warm-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-warm-800">🪟 Site Geneli Popup</h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-warm-500">{popupIsActive ? "Açık" : "Kapalı"}</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={popupIsActive} onChange={(e) => setPopupIsActive(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${popupIsActive ? "bg-brand-500" : "bg-warm-200"}`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${popupIsActive ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </label>
        </div>
        <p className="text-xs text-warm-400">Açıkken tüm sayfalarda görseli sayfa açılışından 1.5 sn sonra popup olarak gösterir. 12 saatte bir tekrar gösterir.</p>

        {/* Görsel */}
        <div>
          <label className={labelCls}>Popup Görseli</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-warm-200 bg-warm-50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {popupImageUrl
                ? <img src={popupImageUrl} alt="Popup" className="w-full h-full object-cover" />
                : <span className="text-3xl">🪟</span>}
            </div>
            <div>
              <input ref={popupRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setPopupImageUrl, setUploadingPopup); }} />
              <button type="button" onClick={() => popupRef.current?.click()} disabled={uploadingPopup}
                className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50">
                {uploadingPopup ? "Yükleniyor…" : popupImageUrl ? "Değiştir" : "Yükle"}
              </button>
              {popupImageUrl && <button type="button" onClick={() => setPopupImageUrl("")} className="block text-xs text-red-500 hover:underline mt-1.5">Kaldır</button>}
              <p className="text-xs text-warm-400 mt-1.5">Önerilen: 600 × 600 px (kare)</p>
            </div>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className={labelCls}>Tıklama Linki <span className="text-xs text-warm-400">(opsiyonel)</span></label>
          <input type="url" value={popupLinkUrl} onChange={(e) => setPopupLinkUrl(e.target.value)}
            placeholder="https://example.com" className={inputCls} />
        </div>
      </div>

      {/* Reklam Toggle */}
      <div className="border border-warm-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-warm-800">💰 Reklamlar</h2>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={adsenseEnabled}
              onChange={(e) => setAdsenseEnabled(e.target.checked)}
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${adsenseEnabled ? "bg-brand-500" : "bg-warm-200"}`} />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${adsenseEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-warm-800">
              Reklamları Göster
            </p>
            <p className="text-xs text-warm-400 mt-0.5">
              Kapalıyken sitedeki tüm reklam alanları gizlenir (custom + AdSense).
            </p>
          </div>
        </label>
      </div>

      {message && (
        <p className={`text-sm px-4 py-2.5 rounded-xl border ${message.startsWith("✅") ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
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
