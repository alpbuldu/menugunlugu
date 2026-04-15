"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), { ssr: false });

const inputCls  = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";
const labelCls  = "block text-sm font-medium text-warm-700 mb-1.5";

export default function PostSubmitForm() {
  const [title,      setTitle]      = useState("");
  const [excerpt,    setExcerpt]    = useState("");
  const [content,    setContent]    = useState("");
  const [imageUrl,   setImageUrl]   = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);

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
    if (!content.trim()) { setError("İçerik boş bırakılamaz."); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/member/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     title.trim(),
        excerpt:   excerpt.trim() || null,
        content:   content.trim(),
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
        <div className="text-5xl mb-4">✍️</div>
        <h2 className="text-xl font-bold text-warm-800 mb-2">Yazınız gönderildi!</h2>
        <p className="text-warm-500 text-sm mb-6">
          İncelendikten sonra yayına alınacak. Durumu panelinden takip edebilirsiniz.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/uye/panel?tab=yazilarim"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
            Panele git
          </a>
          <button onClick={() => {
            setSubmitted(false); setTitle(""); setExcerpt(""); setContent(""); setImageUrl("");
          }}
            className="px-5 py-2.5 rounded-xl border border-warm-200 hover:bg-warm-50 text-warm-700 text-sm font-medium transition-colors">
            Yeni yazı ekle
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

      {/* İçerik */}
      <div>
        <label className={labelCls}>İçerik <span className="text-red-400">*</span></label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Yazınızı buraya yazın…"
          minHeight="340px"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button type="submit" disabled={submitting}
          className={[
            "w-full py-3 rounded-xl font-medium text-sm transition-colors",
            submitting
              ? "bg-warm-200 text-warm-400 cursor-not-allowed"
              : "bg-brand-500 hover:bg-brand-600 text-white",
          ].join(" ")}>
          {submitting ? "Gönderiliyor…" : "Yazıyı Gönder"}
        </button>
        <p className="text-center text-xs text-warm-400 mt-2">
          Yazılar yayına alınmadan önce incelenmektedir.
        </p>
      </div>
    </form>
  );
}
