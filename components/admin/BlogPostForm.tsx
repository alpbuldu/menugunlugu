"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { BlogCategory, BlogPost } from "@/lib/types";

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
  post?: BlogPost; // undefined = create
}

export default function BlogPostForm({ categories, post }: Props) {
  const router    = useRouter();
  const isEdit    = !!post;
  const fileRef   = useRef<HTMLInputElement>(null);

  const [title,       setTitle]       = useState(post?.title ?? "");
  const [slug,        setSlug]        = useState(post?.slug ?? "");
  const [excerpt,     setExcerpt]     = useState(post?.excerpt ?? "");
  const [content,     setContent]     = useState(post?.content ?? "");
  const [imageUrl,    setImageUrl]    = useState(post?.image_url ?? "");
  const [categoryId,  setCategoryId]  = useState(post?.category_id ?? "");
  const [published,   setPublished]   = useState(post?.published ?? true);
  const [slugEdited,  setSlugEdited]  = useState(isEdit);
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  function handleSlugChange(val: string) {
    setSlug(val);
    setSlugEdited(true);
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
        title:       title.trim(),
        slug:        slug.trim() || toSlug(title.trim()),
        excerpt:     excerpt.trim() || null,
        content:     content.trim(),
        image_url:   imageUrl || null,
        category_id: categoryId || null,
        published,
      };

      const res = await fetch(
        isEdit ? `/api/blog/posts/${post!.id}` : "/api/blog/posts",
        {
          method:  isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        }
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Başlık</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Slug (URL)</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-warm-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <p className="text-xs text-warm-400 mt-1">Başlıktan otomatik oluşturulur, düzenleyebilirsiniz.</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-2.5 border border-warm-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        >
          <option value="">Kategori seçin (isteğe bağlı)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Özet (excerpt)</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Kısa açıklama — kart üzerinde ve meta description olarak kullanılır (isteğe bağlı)"
          className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={() => setPublished(v => !v)}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
            published ? "bg-brand-600" : "bg-warm-300",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              published ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
        <span className="text-sm font-medium text-warm-700">
          {published ? "Yayınlı" : "Taslak"}
        </span>
      </div>

      {/* Image */}
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
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

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">İçerik</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          required
          placeholder="Blog yazısı içeriği…"
          className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm leading-relaxed resize-y focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
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
