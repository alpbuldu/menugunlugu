"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

const RecipeEditor = dynamic(() => import("@/components/admin/RecipeEditor"), { ssr: false });

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "soup",    label: "Çorba",          emoji: "🍲" },
  { value: "main",    label: "Ana Yemek",       emoji: "🍽️" },
  { value: "side",    label: "Yardımcı Lezzet", emoji: "🥗" },
  { value: "dessert", label: "Tatlı",           emoji: "🍮" },
];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

interface Props {
  recipe: {
    id: string;
    title: string;
    category: string;
    servings: number | null;
    description: string | null;
    ingredients: string;
    instructions: string;
    image_url: string | null;
    approval_status: string;
  };
}

export default function RecipeEditForm({ recipe }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title,        setTitle]        = useState(recipe.title);
  const [category,     setCategory]     = useState<Category>(recipe.category as Category);
  const [servings,     setServings]     = useState(recipe.servings?.toString() ?? "");
  const [description,  setDescription]  = useState(recipe.description ?? "");
  const [ingredients,  setIngredients]  = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState(recipe.instructions);
  const [imageUrl,     setImageUrl]     = useState(recipe.image_url ?? "");
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [done,         setDone]         = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/member/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Görsel yüklenemedi."); return; }
    setImageUrl(data.url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredients.trim()) { setError("Malzemeler boş bırakılamaz."); return; }
    if (!instructions.trim()) { setError("Yapılış boş bırakılamaz."); return; }
    setSaving(true); setError("");

    const res = await fetch(`/api/member/recipes/${recipe.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title: title.trim(),
        category,
        servings:    servings || null,
        description: description.trim() || null,
        ingredients,
        instructions,
        image_url: imageUrl || null,
      }),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Kaydedilemedi."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-warm-200 p-10 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-warm-800 mb-2">Değişiklikler kaydedildi!</h2>
        <p className="text-warm-500 text-sm mb-6">
          Tarifin tekrar incelemeye alındı. Onaylandıktan sonra yeni hali yayınlanacak.
        </p>
        <button onClick={() => router.push("/uye/panel")}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
          Panele dön
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Başlık */}
      <div>
        <label className={labelCls}>Tarif Adı <span className="text-red-400">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required placeholder="örn: Mercimek Çorbası" className={inputCls} />
      </div>

      {/* Kategori + Porsiyon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kategori <span className="text-red-400">*</span></label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Kaç kişilik?</label>
          <input type="number" value={servings} onChange={(e) => setServings(e.target.value)}
            min={1} max={50} placeholder="4" className={inputCls} />
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <label className={labelCls}>Kısa Açıklama</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={2} placeholder="Bu tarif hakkında kısa ve iştah açıcı bir cümle…"
          className={`${inputCls} resize-none`} />
      </div>

      {/* Görsel */}
      <div>
        <label className={labelCls}>Tarif Görseli</label>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-warm-200 flex-shrink-0">
              <Image src={imageUrl} alt="Görsel" fill className="object-cover" />
              <button type="button" onClick={() => setImageUrl("")}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center text-2xl flex-shrink-0">🖼️</div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="px-4 py-2 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors disabled:opacity-50">
              {uploading ? "Yükleniyor…" : "Görsel Seç"}
            </button>
            <p className="text-xs text-warm-400 mt-1.5">JPG, PNG veya WebP — maks. 5 MB</p>
          </div>
        </div>
      </div>

      {/* Malzemeler */}
      <div>
        <label className={labelCls}>Malzemeler <span className="text-red-400">*</span></label>
        <RecipeEditor value={ingredients} onChange={setIngredients}
          placeholder="2 su bardağı un, 1 adet yumurta…" minHeight="160px" mode="ingredients" />
      </div>

      {/* Yapılış */}
      <div>
        <label className={labelCls}>Yapılışı <span className="text-red-400">*</span></label>
        <RecipeEditor value={instructions} onChange={setInstructions}
          placeholder="Malzemeleri hazırlayın…" minHeight="220px" mode="instructions" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-3 rounded-xl font-medium text-sm bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-colors">
          {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
        <button type="button" onClick={() => router.push("/uye/panel")}
          className="px-5 py-3 rounded-xl border border-warm-200 text-warm-700 text-sm font-medium hover:bg-warm-50 transition-colors">
          İptal
        </button>
      </div>
    </form>
  );
}
