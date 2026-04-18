"use client";

import { useState, useRef } from "react";

interface Ad {
  id: number;
  title: string | null;
  image_url: string;
  link_url: string;
  placement: string;
  is_active: boolean;
  created_at: string;
}

const PLACEMENT_LABELS: Record<string, string> = {
  home:          "Ana Sayfa",
  menu:          "Günün Menüsü",
  archive:       "Dünün Menüsü",
  blog_post:     "Blog İçi",
  recipe_detail: "Tarif Detayı",
  menu_builder:  "Menü Oluştur",
};

const PLACEMENTS = Object.keys(PLACEMENT_LABELS);

interface Props {
  initialAds: Ad[];
}

export default function ReklamlarClient({ initialAds }: Props) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState("home");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Yükleme başarısız");
      setImageUrl(json.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl || !linkUrl || !placement) {
      setError("Görsel, link ve konum zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, image_url: imageUrl, link_url: linkUrl, placement }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hata oluştu");
      setAds([json, ...ads]);
      setShowForm(false);
      setTitle(""); setImageUrl(""); setLinkUrl(""); setPlacement("home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(ad: Ad) {
    const res = await fetch("/api/admin/ads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, is_active: !ad.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAds(ads.map((a) => (a.id === ad.id ? updated : a)));
    }
  }

  async function deleteAd(id: number) {
    if (!confirm("Bu reklamı silmek istediğinden emin misin?")) return;
    const res = await fetch("/api/admin/ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setAds(ads.filter((a) => a.id !== id));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Reklamlar</h1>
          <p className="text-sm text-warm-500 mt-0.5">{ads.length} reklam</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          {showForm ? "İptal" : "+ Yeni Reklam"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-warm-800 mb-4">Yeni Reklam Ekle</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1">Başlık (opsiyonel)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Trendyol Yaz Kampanyası"
                className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1">Banner Görseli *</label>
              {imageUrl && (
                <div className="mb-2 rounded-xl overflow-hidden border border-warm-100 max-w-sm">
                  <img src={imageUrl} alt="Önizleme" className="w-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-warm-200 rounded-xl text-sm text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Yükleniyor…" : imageUrl ? "Görseli Değiştir" : "Görsel Seç"}
                </button>
                {imageUrl && (
                  <span className="text-xs text-green-600 font-medium">✓ Yüklendi</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1">Hedef Link *</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.trendyol.com/..."
                required
                className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1">Konum *</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Reklamı Kaydet"}
            </button>
          </form>
        </div>
      )}

      {/* Ads List */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-warm-500 text-sm">Henüz reklam eklenmemiş.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-20 h-12 rounded-lg overflow-hidden border border-warm-100 flex-shrink-0">
                <img src={ad.image_url} alt={ad.title ?? "Reklam"} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-warm-800 truncate">
                  {ad.title || "—"}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700">
                    {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                  </span>
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-warm-400 hover:text-brand-600 truncate max-w-[200px]"
                  >
                    {ad.link_url}
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(ad)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    ad.is_active
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      : "bg-warm-50 border-warm-200 text-warm-500 hover:bg-warm-100"
                  }`}
                >
                  {ad.is_active ? "Aktif" : "Pasif"}
                </button>
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
