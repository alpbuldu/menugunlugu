"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Recipe, Category } from "@/lib/types";

const RecipeEditor = dynamic(() => import("./RecipeEditor"), { ssr: false });

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "soup",    label: "Çorba" },
  { value: "main",    label: "Ana Yemek" },
  { value: "side",    label: "Yardımcı Lezzetler" },
  { value: "dessert", label: "Tatlı" },
];

interface Props {
  recipe?: Recipe; // undefined = create, defined = edit
}

export default function RecipeForm({ recipe }: Props) {
  const router     = useRouter();
  const isEdit     = !!recipe;
  const fileRef    = useRef<HTMLInputElement>(null);

  const [title,        setTitle]        = useState(recipe?.title        ?? "");
  const [category,     setCategory]     = useState<Category>(recipe?.category ?? "soup");
  const [servings,     setServings]     = useState<string>(recipe?.servings?.toString() ?? "");
  const [description,  setDescription]  = useState(recipe?.description  ?? "");
  const [seoTitle,     setSeoTitle]     = useState(recipe?.seo_title     ?? "");
  const [seoKeywords,  setSeoKeywords]  = useState(recipe?.seo_keywords  ?? "");
  const [seoOpen,      setSeoOpen]      = useState(false);
  const [ingredients,  setIngredients]  = useState(recipe?.ingredients  ?? "");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");
  const [imageUrl,     setImageUrl]     = useState(recipe?.image_url    ?? "");
  const [preview,      setPreview]      = useState(
    recipe?.image_url && recipe.image_url.trim() ? recipe.image_url : ""
  );

  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  /* ── Image upload ──────────────────────────────────────── */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview while uploading
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok) {
      setImageUrl(data.url);
    } else {
      setError(data.error ?? "Fotoğraf yüklenemedi.");
      setPreview(imageUrl); // revert preview
    }
    setUploading(false);
  }

  /* ── Form submit ───────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) return;
    if (!servings || parseInt(servings) < 1) { setError("Kaç kişilik olduğunu giriniz."); return; }
    setSaving(true);
    setError("");

    const res = await fetch(
      isEdit ? `/api/recipes/${recipe!.id}` : "/api/recipes",
      {
        method:  isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, category, description: description || null, seo_title: seoTitle || null, seo_keywords: seoKeywords || null, ingredients, instructions, image_url: imageUrl, servings: servings ? parseInt(servings) : null }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      router.push("/admin/recipes");
      router.refresh();
    } else {
      setError(data.error ?? "Kaydedilemedi.");
      setSaving(false);
    }
  }

  /* ── UI ────────────────────────────────────────────────── */
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Tarif Adı <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Örn: Mercimek Çorbası"
          className={inputCls}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Kategori <span className="text-red-400">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          required
          className={inputCls}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Servings */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Kaç Kişilik <span className="text-red-400">*</span>
        </label>
        <select
          required
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className={`${inputCls} w-40`}
        >
          <option value="">Seçiniz</option>
          {[2, 4, 6, 8, 10].map((n) => (
            <option key={n} value={n}>{n} kişilik</option>
          ))}
        </select>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Fotoğraf
        </label>

        {preview && (
          <div className="relative h-52 mb-3 rounded-xl overflow-hidden border border-warm-100 bg-warm-50">
            <Image src={preview} alt="Önizleme" fill className="object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-sm text-warm-600 font-medium animate-pulse">
                  Yükleniyor…
                </span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-warm-100 border border-warm-200 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200 disabled:opacity-50 transition-colors"
        >
          {uploading
            ? "Yükleniyor…"
            : preview
            ? "Fotoğrafı Değiştir"
            : "Fotoğraf Seç"}
        </button>
        <p className="text-xs text-warm-400 mt-1.5">
          JPG, PNG veya WebP — maks. 5 MB
        </p>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Malzemeler <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-warm-400 mb-1.5">
          Her malzemeyi ayrı satırda girin. Bölümler için <strong>Başlık</strong> seçin (örn: Sos için, Hamur için)
        </p>
        <RecipeEditor
          value={ingredients}
          onChange={setIngredients}
          placeholder="2 su bardağı un&#10;1 adet yumurta&#10;…"
          minHeight="160px"
          mode="ingredients"
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Yapılışı <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-warm-400 mb-1.5">
          Her adımı ayrı satıra yazın. Sayfa üzerinde otomatik olarak 1, 2, 3… şeklinde numaralanır.
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
          rows={8}
          placeholder={"Unu eleyin ve yumurtayla karıştırın.\nSuyu ekleyip yoğurun.\nYağı gezdirin ve pişirin."}
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* ── SEO Ayarları ── */}
      <div className="border border-warm-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setSeoOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-warm-50 hover:bg-warm-100 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-warm-800">🔍 SEO Ayarları</span>
          <span className="text-xs text-warm-400">{seoOpen ? "▲ Kapat" : "▼ Aç"}</span>
        </button>

        {seoOpen && (
          <div className="px-5 py-5 space-y-5 bg-white">
            <p className="text-xs text-warm-400 -mt-1">
              Boş bırakılan alanlarda tarif adı ve açıklama otomatik olarak kullanılır.
            </p>

            {/* Meta başlık */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Meta Başlık
                <span className="ml-2 text-xs font-normal text-warm-400">— tarayıcı sekmesi ve Google</span>
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={70}
                placeholder={title || "Tarif adı"}
                className={inputCls}
              />
              <p className="text-xs text-warm-400 mt-1 text-right">{seoTitle.length}/70</p>
            </div>

            {/* Meta açıklama */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Meta Açıklama
                <span className="ml-2 text-xs font-normal text-warm-400">— Google arama sonucu özeti</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={160}
                placeholder="Bu tarif hakkında kısa ve çekici bir açıklama…"
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-warm-400 mt-1 text-right">{description.length}/160</p>
            </div>

            {/* Anahtar kelimeler */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Anahtar Kelimeler
                <span className="ml-2 text-xs font-normal text-warm-400">— virgülle ayır</span>
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder={
                  title
                    ? `${title}, ${title} tarifi, ${(CATEGORIES.find(c => c.value === category)?.label ?? "").toLowerCase()} tarifi, Menü Günlüğü`
                    : "mercimek çorbası, çorba tarifi, kolay tarif…"
                }
                className={inputCls}
              />
              {title && !seoKeywords && (
                <p className="text-xs text-warm-400 mt-1">
                  Boş bırakılırsa otomatik: <span className="text-warm-500 italic">{title}, {title} tarifi, {(CATEGORIES.find(c => c.value === category)?.label ?? "").toLowerCase()} tarifi…</span>
                </p>
              )}
            </div>

            {/* Google Önizlemesi */}
            {title && (
              <div>
                <p className="text-xs font-medium text-warm-600 mb-2">Google Önizlemesi</p>
                <div className="bg-white border border-warm-100 rounded-xl p-4 space-y-0.5">
                  <p className="text-[#1a0dab] text-base font-medium leading-snug hover:underline cursor-pointer truncate">
                    {seoTitle || title} | Menü Günlüğü
                  </p>
                  <p className="text-xs text-green-700">menugunlugu.com/recipes/{recipe?.slug ?? "tarif-slug"}</p>
                  <p className="text-sm text-warm-600 leading-snug line-clamp-2">
                    {description || `${title} tarifi — malzemeler ve yapılışı.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          ⚠️ {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Tarifi Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl font-medium text-sm hover:bg-warm-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
