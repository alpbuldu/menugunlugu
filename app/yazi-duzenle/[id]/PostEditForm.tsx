"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
const labelCls = "block text-sm font-medium text-warm-700 mb-1.5";

interface Props {
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    approval_status: string;
  };
}

export default function PostEditForm({ post }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title,      setTitle]      = useState(post.title);
  const [excerpt,    setExcerpt]    = useState(post.excerpt ?? "");
  const [content,    setContent]    = useState(post.content);
  const [imageUrl,   setImageUrl]   = useState(post.image_url ?? "");
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

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
    if (!content.trim()) { setError("İçerik boş bırakılamaz."); return; }
    setSaving(true); setError("");

    const res = await fetch(`/api/member/posts/${post.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:     title.trim(),
        excerpt:   excerpt.trim() || null,
        content:   content.trim(),
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
          Yazın tekrar incelemeye alındı. Onaylandıktan sonra yeni hali yayınlanacak.
        </p>
        <button onClick={() => router.push("/uye/panel?tab=yazilarim")}
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
        <label className={labelCls}>Başlık <span className="text-red-400">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          required placeholder="Yazınızın başlığı…" className={inputCls} />
      </div>

      {/* Özet */}
      <div>
        <label className={labelCls}>Kısa Özet</label>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
          rows={2} placeholder="Yazınızı özetleyen 1-2 cümle…"
          className={`${inputCls} resize-none`} />
      </div>

      {/* Kapak görseli */}
      <div>
        <label className={labelCls}>Kapak Görseli</label>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-warm-200 flex-shrink-0">
              <Image src={imageUrl} alt="Kapak görseli" fill className="object-cover" />
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
            <p className="text-xs text-warm-400 mt-1.5">JPG, PNG veya WebP</p>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div>
        <label className={labelCls}>İçerik <span className="text-red-400">*</span></label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          required
          placeholder="Yazınızı buraya yazın…"
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-3 rounded-xl font-medium text-sm bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-colors">
          {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
        <button type="button" onClick={() => router.push("/uye/panel?tab=yazilarim")}
          className="px-5 py-3 rounded-xl border border-warm-200 text-warm-700 text-sm font-medium hover:bg-warm-50 transition-colors">
          İptal
        </button>
      </div>
      <p className="text-center text-xs text-warm-400 -mt-2">
        Düzenlenen yazılar yayına alınmadan önce tekrar incelenmektedir.
      </p>
    </form>
  );
}
