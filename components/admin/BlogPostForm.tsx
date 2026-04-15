"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { BlogCategory, BlogPost } from "@/lib/types";

// TipTap SSR sorununu önlemek için dinamik import
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

interface Props {
  categories: BlogCategory[];
  post?: BlogPost;
  apiEndpoint?: string; // override PUT/POST endpoint (e.g. for member posts)
}

export default function BlogPostForm({ categories, post, apiEndpoint }: Props) {
  const router   = useRouter();
  const isEdit   = !!post;
  const fileRef  = useRef<HTMLInputElement>(null);
  const [seoOpen, setSeoOpen] = useState(false);

  const [title,       setTitle]       = useState(post?.title ?? "");
  const [slug,        setSlug]        = useState(post?.slug ?? "");
  const [excerpt,     setExcerpt]     = useState(post?.excerpt ?? "");
  const [content,     setContent]     = useState(post?.content ?? "");
  const [imageUrl,    setImageUrl]    = useState(post?.image_url ?? "");
  const [categoryId,  setCategoryId]  = useState(post?.category_id ?? "");
  const [published,   setPublished]   = useState(post?.published ?? true);
  const [seoTitle,    setSeoTitle]    = useState(post?.seo_title ?? "");
  const [seoKeywords, setSeoKeywords] = useState(post?.seo_keywords ?? "");
  const [slugEdited,  setSlugEdited]  = useState(isEdit);
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const inputCls = "w-full px-4 py-2.5 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200";

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res  = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { alert(json.error ?? "Yükleme başarısız"); return; }
      setImageUrl(json.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Başlık ve içerik zorunlu");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        title:        title.trim(),
        slug:         slug.trim() || toSlug(title.trim()),
        excerpt:      excerpt.trim() || null,
        content:      content.trim(),
        image_url:    imageUrl || null,
        category_id:  categoryId || null,
        published,
        seo_title:    seoTitle.trim() || null,
        seo_keywords: seoKeywords.trim() || null,
      };
      const defaultEndpoint = isEdit ? `/api/blog/posts/${post!.id}` : "/api/blog/posts";
      const res  = await fetch(
        apiEndpoint ?? defaultEndpoint,
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Hata oluştu"); return; }
      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("Sunucu hatası");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* Başlık */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Başlık</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className={inputCls}
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Slug (URL)</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
          className={`${inputCls} font-mono`}
        />
        <p className="text-xs text-warm-400 mt-1">Başlıktan otomatik oluşturulur, düzenleyebilirsiniz.</p>
      </div>

      {/* Kategori */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputCls} bg-white`}
        >
          <option value="">Kategori seçin (isteğe bağlı)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Özet — meta description olarak da kullanılır */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Özet
          <span className="ml-2 text-xs font-normal text-warm-400">— kart üzerinde ve meta description olarak kullanılır</span>
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={160}
          placeholder="Kısa açıklama…"
          className={`${inputCls} resize-none`}
        />
        <p className="text-xs text-warm-400 mt-1 text-right">{excerpt.length}/160</p>
      </div>

      {/* Yayın durumu */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={() => setPublished(v => !v)}
          className={["relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
            published ? "bg-brand-600" : "bg-warm-300"].join(" ")}
        >
          <span className={["inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            published ? "translate-x-6" : "translate-x-1"].join(" ")} />
        </button>
        <span className="text-sm font-medium text-warm-700">
          {published ? "Yayınlı" : "Taslak"}
        </span>
      </div>

      {/* Kapak Görseli */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Kapak Görseli</label>
        {imageUrl && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 border border-warm-200">
            <Image src={imageUrl} alt="Kapak" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-2 right-2 bg-white/80 text-warm-700 text-xs px-2 py-1 rounded-lg hover:bg-white transition-colors"
            >
              Kaldır
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 border border-warm-200 rounded-xl text-sm text-warm-600 hover:bg-warm-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Yükleniyor…" : imageUrl ? "Görseli Değiştir" : "Görsel Yükle"}
        </button>
      </div>

      {/* İçerik — TipTap editör */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">İçerik</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Blog yazısı içeriği…"
          minHeight="340px"
        />
      </div>

      {/* ── SEO Ayarları — açılır/kapanır ── */}
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
              Boş bırakılan alanlarda başlık ve özet otomatik olarak kullanılır.
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
                placeholder={title || "Yazı başlığı"}
                className={inputCls}
              />
              <p className="text-xs text-warm-400 mt-1 text-right">{seoTitle.length}/70</p>
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
                    ? [title, categories.find(c => c.id === categoryId)?.name, "yemek blogu", "Menü Günlüğü"].filter(Boolean).join(", ")
                    : "tarif, yemek, menü…"
                }
                className={inputCls}
              />
              {title && !seoKeywords && (
                <p className="text-xs text-warm-400 mt-1">
                  Boş bırakılırsa otomatik: <span className="text-warm-500 italic">
                    {[title, categories.find(c => c.id === categoryId)?.name, "yemek blogu", "Menü Günlüğü"].filter(Boolean).join(", ")}
                  </span>
                </p>
              )}
            </div>

            {/* Önizleme */}
            {(title || excerpt) && (
              <div>
                <p className="text-xs font-medium text-warm-600 mb-2">Google Önizlemesi</p>
                <div className="bg-white border border-warm-100 rounded-xl p-4 space-y-0.5">
                  <p className="text-[#1a0dab] text-base font-medium leading-snug hover:underline cursor-pointer truncate">
                    {seoTitle || title || "Sayfa Başlığı"} | Menü Günlüğü
                  </p>
                  <p className="text-xs text-green-700">menugunlugu.com/blog/{slug || "yazi-slug"}</p>
                  <p className="text-sm text-warm-600 leading-snug line-clamp-2">
                    {excerpt || "Özet girilmemiş — içeriğin ilk cümlesi kullanılacak."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          ⚠️ {error}
        </p>
      )}

      {/* Kaydet */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Yayınla"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="px-6 py-2.5 border border-warm-200 text-warm-600 rounded-xl text-sm hover:bg-warm-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
