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
  home_popup:            "Ana Sayfa — Popup",
  home:                  "Ana Sayfa — Sponsorlu Kart (slider ortası)",
  home_banner:           "Ana Sayfa — Yatay Banner (tarifler altı)",
  menu_banner:           "Günün Menüsü — Yatay Banner",
  sidebar_menu:          "Günün Menüsü — Dikey Kenar",
  archive_banner:        "Dünün Menüsü — Yatay Banner",
  sidebar_archive:       "Dünün Menüsü — Dikey Kenar",
  recipes_banner:        "Tarifler Listesi — Yatay Banner",
  sidebar_recipes:       "Tarifler Listesi — Dikey Kenar",
  recipe_detail_banner:  "Tarif Detayı — Yatay Banner",
  sidebar_recipe_detail: "Tarif Detayı — Dikey Kenar",
  blog_banner:           "Blog Listesi — Yatay Banner",
  sidebar_blog:          "Blog Listesi — Dikey Kenar",
  blog_post_banner:      "Blog Yazısı — Yatay Banner",
  sidebar_blog_post:     "Blog Yazısı — Dikey Kenar",
};

const PLACEMENT_SIZES: Record<string, string> = {
  home_popup:            "600 × 600 px (kare) veya 600 × 800 px (dikey)",
  home:                  "Kare/dikey görsel (tarif kartı boyutunda)",
  home_banner:           "728 × 160 px (masaüstü) / 320 × 80 px (mobil)",
  menu_banner:           "1100 × 100 px (tam genişlik yatay)",
  sidebar_menu:          "200 × 600 px (dikey)",
  archive_banner:        "1100 × 100 px (tam genişlik yatay)",
  sidebar_archive:       "200 × 600 px (dikey)",
  recipes_banner:        "1100 × 100 px (tam genişlik yatay)",
  sidebar_recipes:       "200 × 600 px (dikey)",
  recipe_detail_banner:  "700 × 100 px (tam genişlik yatay)",
  sidebar_recipe_detail: "200 × 600 px (dikey)",
  blog_banner:           "1100 × 100 px (tam genişlik yatay)",
  sidebar_blog:          "200 × 600 px (dikey)",
  blog_post_banner:      "700 × 100 px (tam genişlik yatay)",
  sidebar_blog_post:     "200 × 600 px (dikey)",
};

const PLACEMENTS = Object.keys(PLACEMENT_LABELS);

interface Props {
  initialAds: Ad[];
}

function AdForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Ad;
  onSave: (ad: Ad) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? "");
  const [placement, setPlacement] = useState(initial?.placement ?? "home");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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
      const isEdit = !!initial;
      const res = await fetch("/api/admin/ads", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: initial!.id, title, image_url: imageUrl, link_url: linkUrl, placement }
            : { title, image_url: imageUrl, link_url: linkUrl, placement }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hata oluştu");
      onSave(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 mb-6">
      <h2 className="text-base font-semibold text-warm-800 mb-4">
        {initial ? "Reklamı Düzenle" : "Yeni Reklam Ekle"}
      </h2>
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
          {placement && (
            <p className="text-[11px] text-warm-400 mt-1">
              Önerilen görsel boyutu: <span className="font-medium text-warm-600">{PLACEMENT_SIZES[placement]}</span>
            </p>
          )}
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
            {imageUrl && <span className="text-xs text-green-600 font-medium">✓ Yüklendi</span>}
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

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : initial ? "Değişiklikleri Kaydet" : "Reklamı Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-warm-200 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReklamlarClient({ initialAds }: Props) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
          onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          {showAddForm ? "İptal" : "+ Yeni Reklam"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AdForm
          onSave={(ad) => {
            setAds([ad, ...ads]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
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
            <div key={ad.id}>
              {/* Edit Form */}
              {editingId === ad.id && (
                <AdForm
                  initial={ad}
                  onSave={(updated) => {
                    setAds(ads.map((a) => (a.id === updated.id ? updated : a)));
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {/* Ad Row */}
              {editingId !== ad.id && (
                <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4 flex items-center gap-4">
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
                      onClick={() => { setEditingId(ad.id); setShowAddForm(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 border border-brand-100 hover:bg-brand-50 transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
