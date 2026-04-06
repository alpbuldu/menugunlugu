"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Recipe, Category } from "@/lib/types";

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
    setSaving(true);
    setError("");

    const res = await fetch(
      isEdit ? `/api/recipes/${recipe!.id}` : "/api/recipes",
      {
        method:  isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, category, ingredients, instructions, image_url: imageUrl, servings: servings ? parseInt(servings) : null }),
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
          Kaç Kişilik
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          placeholder="Örn: 4"
          className={`${inputCls} w-32`}
        />
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
        <p className="text-xs text-warm-400 mb-1.5">Her malzemeyi ayrı satıra yazın</p>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          required
          rows={7}
          placeholder={"2 su bardağı kırmızı mercimek\n1 adet soğan\n2 diş sarımsak"}
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Yapılışı <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-warm-400 mb-1.5">Her adımı ayrı satıra yazın</p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
          rows={9}
          placeholder={"1. Mercimeği yıkayın.\n2. Soğanı kavurun.\n3. Malzemeleri ekleyip pişirin."}
          className={`${inputCls} resize-y`}
        />
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
