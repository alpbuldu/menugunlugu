"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { clsx } from "clsx";
import type { Category } from "@/lib/types";

const RecipeEditor = dynamic(() => import("@/components/admin/RecipeEditor"), { ssr: false });

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "soup",    label: "Çorba",            emoji: "🍲" },
  { value: "main",    label: "Ana Yemek",         emoji: "🍽️" },
  { value: "side",    label: "Yardımcı Lezzet",   emoji: "🥗" },
  { value: "dessert", label: "Tatlı",             emoji: "🍮" },
];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

export default function RecipeSubmitForm() {
  const [title,        setTitle]        = useState("");
  const [category,     setCategory]     = useState<Category>("main");
  const [servings,     setServings]     = useState("");
  const [description,  setDescription]  = useState("");
  const [ingredients,  setIngredients]  = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageUrl,     setImageUrl]     = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
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
    if (!servings || parseInt(servings) < 1) { setError("Kaç kişilik olduğunu giriniz."); return; }
    if (!ingredients.trim()) { setError("Malzemeler boş bırakılamaz."); return; }
    if (!instructions.trim()) { setError("Yapılış boş bırakılamaz."); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/member/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        category,
        servings: servings || null,
        description: description.trim() || null,
        ingredients,
        instructions,
        image_url: imageUrl || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error ?? "Gönderilemedi."); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-warm-200 p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-warm-800 mb-2">Tarifiniz gönderildi!</h2>
        <p className="text-warm-500 text-sm mb-6">
          Tarifleriniz incelendikten sonra yayına alınacak. Durumu panelinden takip edebilirsiniz.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/uye/panel"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
            Panele git
          </a>
          <button onClick={() => {
            setSubmitted(false); setTitle(""); setCategory("main"); setServings("");
            setDescription(""); setIngredients(""); setInstructions(""); setImageUrl("");
          }}
            className="px-5 py-2.5 rounded-xl border border-warm-200 hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors">
            Yeni tarif ekle
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
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
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
            className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Kaç kişilik? <span className="text-red-400">*</span></label>
          <select value={servings} onChange={(e) => setServings(e.target.value)} required className={inputCls}>
            <option value="">Seçiniz</option>
            {[2, 4, 8].map((n) => (
              <option key={n} value={n}>{n} kişilik</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kısa açıklama */}
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
              <Image src={imageUrl} alt="Tarif görseli" fill className="object-cover" />
              <button type="button" onClick={() => setImageUrl("")}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                ✕
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center text-2xl flex-shrink-0">
              🖼️
            </div>
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
        <p className="text-xs text-warm-400 mb-1.5">
          Her malzemeyi ayrı satırda girin. Bölümler için <strong>Başlık</strong> seçin (örn: Sos için, Hamur için)
        </p>
        <RecipeEditor
          value={ingredients}
          onChange={setIngredients}
          placeholder="• 2 su bardağı un&#10;• 1 adet yumurta…"
          minHeight="160px"
          mode="ingredients"
        />
      </div>

      {/* Yapılışı */}
      <div>
        <label className={labelCls}>Yapılışı <span className="text-red-400">*</span></label>
        <p className="text-xs text-warm-400 mb-1.5">
          Her adımı ayrı satıra yazın. Sayfa üzerinde otomatik olarak 1, 2, 3… şeklinde numaralanır.
        </p>
        <RecipeEditor
          value={instructions}
          onChange={setInstructions}
          placeholder="1. Malzemeleri hazırlayın…"
          minHeight="220px"
          mode="instructions"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button type="submit" disabled={submitting}
          className={clsx(
            "w-full py-3 rounded-xl font-medium text-sm transition-colors",
            submitting
              ? "bg-warm-200 text-warm-400 cursor-not-allowed"
              : "bg-brand-500 hover:bg-brand-600 text-white"
          )}>
          {submitting ? "Gönderiliyor…" : "Tarifi Gönder"}
        </button>
        <p className="text-center text-xs text-warm-400 mt-2">
          Tarifler yayına alınmadan önce incelenmektedir.
        </p>
      </div>
    </form>
  );
}
