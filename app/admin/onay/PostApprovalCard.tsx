"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BlogCategory { id: string; name: string; slug: string; }

export interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    created_at: string;
    updated_at: string | null;
    profiles: { username: string; avatar_url: string | null } | null;
  };
  categories: BlogCategory[];
}

function isRevision(created_at: string, updated_at: string | null) {
  if (!updated_at) return false;
  return new Date(updated_at).getTime() - new Date(created_at).getTime() > 30_000;
}

// HTML <p> taglarını düz metne çevirir
function htmlToPlain(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n")
    .replace(/<p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .join("\n\n");
}

export default function PostApprovalCard({ post: initial, categories }: PostCardProps) {
  const router = useRouter();
  const [post,    setPost]    = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [acting,  setActing]  = useState<"approve" | "reject" | null>(null);
  const [saveErr, setSaveErr] = useState("");

  const [title,      setTitle]      = useState(post.title);
  const [excerpt,    setExcerpt]    = useState(post.excerpt ?? "");
  const [content,    setContent]    = useState(() => htmlToPlain(post.content));
  const [categoryId, setCategoryId] = useState("");

  function startEdit() {
    setTitle(post.title);
    setExcerpt(post.excerpt ?? "");
    setContent(htmlToPlain(post.content));
    setEditing(true);
    setSaveErr("");
  }

  async function saveEdits() {
    if (!title.trim()) { setSaveErr("Başlık boş olamaz."); return; }
    setSaving(true); setSaveErr("");
    const newContent = content.trim().split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join("");
    const fields: Record<string, unknown> = {
      title:   title.trim(),
      excerpt: excerpt.trim() || null,
      content: newContent,
    };
    const res = await fetch("/api/admin/onay", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, type: "post", fields }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveErr(data.error ?? "Kaydedilemedi."); return; }
    setPost(p => ({ ...p, title: fields.title as string, excerpt: fields.excerpt as string | null, content: newContent }));
    setEditing(false);
  }

  async function handleAction(action: "approve" | "reject") {
    setActing(action);
    await fetch("/api/admin/onay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: post.id, action, type: "post",
        ...(action === "approve" && categoryId ? { category_id: categoryId } : {}),
      }),
    });
    setActing(null);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
      {/* Üst */}
      <div className="flex gap-4 p-5">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
          {post.image_url ? (
            <Image src={post.image_url} alt={post.title} width={96} height={96}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">✍️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-bold text-warm-900 text-lg leading-snug">{post.title}</h2>
                {isRevision(post.created_at, post.updated_at) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    ✏️ Düzenleme
                  </span>
                )}
              </div>
              <span className="text-xs text-warm-400">
                {new Date(post.created_at).toLocaleDateString("tr-TR")}
              </span>
              {post.excerpt && (
                <p className="text-sm text-warm-500 mt-2">{post.excerpt}</p>
              )}
            </div>
            {post.profiles && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
                  {post.profiles.avatar_url ? (
                    <Image src={post.profiles.avatar_url} alt={post.profiles.username}
                      width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">👤</span>
                  )}
                </div>
                <span className="text-sm text-warm-600 font-medium">{post.profiles.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* İçerik */}
      {editing ? (
        <div className="border-t border-warm-100 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Başlık</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Özet</label>
            <input
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="opsiyonel"
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">
              İçerik <span className="text-warm-400 font-normal normal-case">(her paragraf boş satırla ayrılır)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 leading-relaxed focus:outline-none focus:border-brand-400 resize-y"
            />
          </div>
          {saveErr && <p className="text-sm text-red-500">{saveErr}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-warm-200 text-warm-600 text-sm hover:bg-warm-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={saveEdits}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "💾 Kaydet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-warm-100 p-5">
          <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">İçerik</h3>
          <div
            className="text-sm text-warm-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}

      {/* Aksiyon barı */}
      <div className="border-t border-warm-100 px-5 py-3 bg-warm-50 flex flex-col gap-3">
        {/* Kategori seçimi */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-warm-500 font-medium">Kategori:</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-warm-200 text-sm text-warm-700 bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="">Seç (isteğe bağlı)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {/* Butonlar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={startEdit}
            disabled={!!acting || editing}
            className="px-4 py-2 rounded-xl border border-warm-300 text-warm-600 hover:bg-warm-100 text-sm font-medium transition-colors disabled:opacity-40"
          >
            ✏️ Düzenle
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction("reject")}
              disabled={!!acting}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {acting === "reject" ? "İşleniyor…" : "🗑 Reddet"}
            </button>
            <button
              onClick={() => handleAction("approve")}
              disabled={!!acting}
              className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {acting === "approve" ? "İşleniyor…" : "✅ Onayla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
