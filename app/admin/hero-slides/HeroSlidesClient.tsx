"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface RecipeImage {
  id: number;
  title: string;
  slug: string;
  image_url: string;
}

function RecipePicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [recipes, setRecipes] = useState<RecipeImage[]>([]);
  const [filtered, setFiltered] = useState<RecipeImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("id, title, slug, image_url")
      .not("image_url", "is", null)
      .or("approval_status.eq.approved,approval_status.is.null")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const list = (data ?? []).filter(r => r.image_url) as RecipeImage[];
        setRecipes(list);
        setFiltered(list);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? recipes.filter(r => r.title.toLowerCase().includes(q)) : recipes);
  }, [search, recipes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-warm-100">
          <h3 className="font-semibold text-warm-800">Tariflerden Görsel Seç</h3>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-700 text-xl leading-none">✕</button>
        </div>
        <div className="p-3 border-b border-warm-100">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tarif ara…"
            autoFocus
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="overflow-y-auto p-3">
          {loading ? (
            <p className="text-center text-warm-400 text-sm py-8">Yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-warm-400 text-sm py-8">Sonuç bulunamadı.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onSelect(r.image_url); onClose(); }}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-brand-400 transition-all"
                >
                  <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                    <p className="text-white text-[10px] font-medium px-1.5 py-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                      {r.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HeroSlide {
  id: number;
  slide_key: string | null;
  badge: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string;
  cta_href: string | null;
  image_url: string | null;
  tint: string | null;
  gradient: string;
  is_active: boolean;
  sort_order: number;
}

const DYNAMIC_INFO: Record<string, string> = {
  "gunun-menusu": "Görsel otomatik: bugünün menüsünden çekilir",
  "son-tarif":    "Başlık + link + görsel otomatik: en yeni tariften çekilir",
  "menu-onerileri": "Görsel otomatik: son tariflerden çekilir",
  "blog":         "Başlık + link + görsel otomatik: son blog yazısından çekilir",
  "oyna":         "Görsel otomatik: son tariflerden çekilir",
};

const GRADIENT_PRESETS = [
  { label: "Marka Turuncu-Kahve", value: "from-brand-700 to-warm-800" },
  { label: "Sıcak Kahve", value: "from-warm-800 to-warm-600" },
  { label: "Koyu Turuncu (Menü)", value: "from-[#7C4A1E] to-[#C87941]" },
  { label: "Koyu Yeşil (Blog)", value: "from-[#2C4A3E] to-[#4A7C6A]" },
  { label: "Mor (Oyna)", value: "from-[#3D1F5C] to-[#7B3FA0]" },
  { label: "Koyu Lacivert", value: "from-[#1a2744] to-[#2d4a8a]" },
  { label: "Koyu Kırmızı", value: "from-[#5c1515] to-[#a02020]" },
  { label: "Koyu Petrol", value: "from-[#0d3d3d] to-[#1a6b6b]" },
];

const TINT_PRESETS = [
  { label: "Yok", value: "" },
  { label: "Turuncu %60", value: "bg-[#7C4A1E]/60" },
  { label: "Mor %65", value: "bg-[#3D1F5C]/65" },
  { label: "Siyah %40", value: "bg-black/40" },
  { label: "Siyah %60", value: "bg-black/60" },
];

interface Props { initialSlides: HeroSlide[] }

function SlideForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HeroSlide;
  onSave: (s: HeroSlide) => void;
  onCancel: () => void;
}) {
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.cta_label ?? "");
  const [ctaHref, setCtaHref] = useState(initial?.cta_href ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [gradient, setGradient] = useState(initial?.gradient ?? "from-brand-700 to-warm-800");
  const [customGradient, setCustomGradient] = useState(
    GRADIENT_PRESETS.some(p => p.value === initial?.gradient) ? "" : (initial?.gradient ?? "")
  );
  const [tint, setTint] = useState(initial?.tint ?? "");
  const [customTint, setCustomTint] = useState(
    TINT_PRESETS.some(p => p.value === (initial?.tint ?? "")) ? "" : (initial?.tint ?? "")
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;
  const dynamicInfo = initial?.slide_key ? DYNAMIC_INFO[initial.slide_key] : null;

  const isPresetGradient = GRADIENT_PRESETS.some(p => p.value === gradient);
  const isPresetTint = TINT_PRESETS.some(p => p.value === tint);

  async function handleImageUpload(file: File) {
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Yükleme başarısız");
      setImageUrl(json.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!badge || !ctaLabel) { setError("Badge ve CTA metin zorunludur."); return; }
    const finalGradient = isPresetGradient ? gradient : (customGradient || gradient);
    const finalTint = isPresetTint ? tint : (customTint || tint);
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit
          ? { id: initial!.id, badge, title: title || null, subtitle: subtitle || null, cta_label: ctaLabel, cta_href: ctaHref || null, image_url: imageUrl || null, gradient: finalGradient, tint: finalTint || null }
          : { badge, title: title || null, subtitle: subtitle || null, cta_label: ctaLabel, cta_href: ctaHref || null, image_url: imageUrl || null, gradient: finalGradient, tint: finalTint || null }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hata oluştu");
      onSave(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 mb-4">
      <h2 className="text-base font-semibold text-warm-800 mb-4">
        {isEdit ? "Slide Düzenle" : "Yeni Slide Ekle"}
      </h2>

      {dynamicInfo && (
        <div className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <p className="text-xs text-blue-700">{dynamicInfo}. Buraya görsel veya başlık girilirse otomatik veriyi geçersiz kılar.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Badge */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">Badge Metni *</label>
          <input type="text" value={badge} onChange={e => setBadge(e.target.value)} required
            placeholder="örn: Her Gün Yeni Bir Menü"
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <p className="text-[11px] text-warm-400 mt-1">Sliderın üst kısmındaki turuncu etiket</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">Başlık</label>
          <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2}
            placeholder={dynamicInfo ? "Boş bırakılırsa dinamik veri kullanılır" : "Slide başlığı"}
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          <p className="text-[11px] text-warm-400 mt-1">Satır atlamak için \n kullanın (örn: İlk Satır\nİkinci Satır)</p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">Alt Metin</label>
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
            placeholder="Opsiyonel açıklama (masaüstünde görünür)"
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-warm-600 mb-1">Buton Metni *</label>
            <input type="text" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} required
              placeholder="örn: Günün Menüsünü Gör"
              className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-warm-600 mb-1">Buton Linki</label>
            <input type="text" value={ctaHref} onChange={e => setCtaHref(e.target.value)}
              placeholder={dynamicInfo ? "Boş = dinamik link" : "/sayfa-yolu"}
              className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">
            Görsel {dynamicInfo ? "(opsiyonel — boş bırakılırsa otomatik)" : ""}
          </label>
          {imageUrl && (
            <div className="mb-2 rounded-xl overflow-hidden border border-warm-100 max-h-32 relative">
              <img src={imageUrl} alt="" className="w-full h-32 object-cover" />
              <button type="button" onClick={() => setImageUrl("")}
                className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg hover:bg-black/70">
                Kaldır
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-3 py-2 border border-warm-200 rounded-xl text-sm text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50">
              {uploading ? "Yükleniyor…" : "Bilgisayardan Yükle"}
            </button>
            <button type="button" onClick={() => setShowPicker(true)}
              className="px-3 py-2 border border-brand-200 rounded-xl text-sm text-brand-600 hover:bg-brand-50 transition-colors">
              Tariflerden Seç
            </button>
            {imageUrl && <span className="text-xs text-green-600 font-medium">✓ Seçildi</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          {showPicker && (
            <RecipePicker onSelect={url => setImageUrl(url)} onClose={() => setShowPicker(false)} />
          )}
        </div>

        {/* Gradient */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">Gradient (görsel yoksa arka plan)</label>
          <select value={isPresetGradient ? gradient : "custom"}
            onChange={e => { if (e.target.value === "custom") { setGradient("custom"); } else { setGradient(e.target.value); setCustomGradient(""); } }}
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
            {GRADIENT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            <option value="custom">Özel Tailwind sınıfı…</option>
          </select>
          {(!isPresetGradient || gradient === "custom") && (
            <input type="text" value={customGradient} onChange={e => setCustomGradient(e.target.value)}
              placeholder="örn: from-[#1a2744] to-[#2d4a8a]"
              className="mt-2 w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          )}
        </div>

        {/* Tint */}
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1">Renk Tonu (görsel üzerine şeffaf overlay)</label>
          <select value={isPresetTint ? tint : "custom"}
            onChange={e => { if (e.target.value === "custom") { setTint("custom"); } else { setTint(e.target.value); setCustomTint(""); } }}
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
            {TINT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label || "Yok"}</option>)}
            <option value="custom">Özel Tailwind sınıfı…</option>
          </select>
          {(!isPresetTint || tint === "custom") && (
            <input type="text" value={customTint} onChange={e => setCustomTint(e.target.value)}
              placeholder="örn: bg-[#7C4A1E]/60"
              className="mt-2 w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving || uploading}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
            {saving ? "Kaydediliyor…" : isEdit ? "Kaydet" : "Slide Ekle"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 border border-warm-200 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition-colors">
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

export default function HeroSlidesClient({ initialSlides }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function toggleActive(slide: HeroSlide) {
    const res = await fetch("/api/admin/hero-slides", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slide.id, is_active: !slide.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSlides(slides.map(s => s.id === updated.id ? updated : s));
    }
  }

  async function moveSlide(slide: HeroSlide, direction: "up" | "down") {
    const idx = slides.findIndex(s => s.id === slide.id);
    const other = direction === "up" ? slides[idx - 1] : slides[idx + 1];
    if (!other) return;

    // Swap sort_order values
    const [resA, resB] = await Promise.all([
      fetch("/api/admin/hero-slides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slide.id, sort_order: other.sort_order }),
      }),
      fetch("/api/admin/hero-slides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: other.id, sort_order: slide.sort_order }),
      }),
    ]);
    if (resA.ok && resB.ok) {
      const updA = await resA.json();
      const updB = await resB.json();
      setSlides(prev =>
        prev.map(s => s.id === updA.id ? updA : s.id === updB.id ? updB : s)
            .sort((a, b) => a.sort_order - b.sort_order)
      );
    }
  }

  async function deleteSlide(id: number) {
    if (!confirm("Bu slide'ı silmek istediğinden emin misin?")) return;
    const res = await fetch("/api/admin/hero-slides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setSlides(slides.filter(s => s.id !== id));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Hero Slider</h1>
          <p className="text-sm text-warm-500 mt-0.5">{slides.length} slide — anasayfanın üst slider alanı</p>
        </div>
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
          {showAddForm ? "İptal" : "+ Yeni Slide"}
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800">
        <strong>Not:</strong> Slide sırası aşağıdaki listede göründüğü gibidir. ↑↓ butonlarıyla sıra değiştirebilirsin. Sistem slide'ları (günün menüsü, son tarif, blog) bazı alanlarını otomatik doldurur — o alanlar boş bırakılabilir.
      </div>

      {showAddForm && (
        <SlideForm
          onSave={s => { setSlides([...slides, s].sort((a, b) => a.sort_order - b.sort_order)); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-warm-500 text-sm">Henüz slide eklenmemiş.</p>
          <p className="text-warm-400 text-xs mt-1">Supabase'de hero_slides tablosunu oluşturduktan sonra buradan yönetebilirsin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={slide.id}>
              {editingId === slide.id && (
                <SlideForm
                  initial={slide}
                  onSave={updated => { setSlides(slides.map(s => s.id === updated.id ? updated : s)); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {editingId !== slide.id && (
                <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${slide.is_active ? "border-warm-100" : "border-warm-200 opacity-60"}`}>
                  <div className="flex items-stretch">
                    {/* Image preview */}
                    <div className="w-20 sm:w-28 flex-shrink-0 relative bg-warm-100">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt="" className="w-full h-full object-cover" style={{ minHeight: 72 }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl" style={{ minHeight: 72 }}>
                          🖼️
                        </div>
                      )}
                      {slide.slide_key && (
                        <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                          sistem
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="inline-block bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {slide.badge}
                        </span>
                        {!slide.is_active && (
                          <span className="inline-block bg-warm-100 text-warm-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Pasif
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-warm-800 text-sm mt-1 line-clamp-1">
                        {slide.title ?? <span className="italic text-warm-400">Dinamik başlık</span>}
                      </p>
                      {slide.cta_href ? (
                        <p className="text-[11px] text-warm-400 truncate mt-0.5">{slide.cta_label} → {slide.cta_href}</p>
                      ) : (
                        <p className="text-[11px] text-warm-400 mt-0.5">{slide.cta_label} → <span className="italic">dinamik link</span></p>
                      )}
                      {slide.slide_key && DYNAMIC_INFO[slide.slide_key] && (
                        <p className="text-[10px] text-blue-500 mt-1">{DYNAMIC_INFO[slide.slide_key]}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between gap-1 p-3 flex-shrink-0">
                      {/* Sort controls */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveSlide(slide, "up")} disabled={idx === 0}
                          className="w-7 h-7 flex items-center justify-center text-warm-400 hover:text-warm-700 disabled:opacity-20 border border-warm-100 rounded-lg text-xs transition-colors">
                          ↑
                        </button>
                        <button onClick={() => moveSlide(slide, "down")} disabled={idx === slides.length - 1}
                          className="w-7 h-7 flex items-center justify-center text-warm-400 hover:text-warm-700 disabled:opacity-20 border border-warm-100 rounded-lg text-xs transition-colors">
                          ↓
                        </button>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button onClick={() => toggleActive(slide)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                            slide.is_active
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              : "bg-warm-50 border-warm-200 text-warm-500 hover:bg-warm-100"
                          }`}>
                          {slide.is_active ? "Aktif" : "Pasif"}
                        </button>
                        <button onClick={() => { setEditingId(slide.id); setShowAddForm(false); }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-brand-600 border border-brand-100 hover:bg-brand-50 transition-colors">
                          Düzenle
                        </button>
                        <button onClick={() => deleteSlide(slide.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors">
                          Sil
                        </button>
                      </div>
                    </div>
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
