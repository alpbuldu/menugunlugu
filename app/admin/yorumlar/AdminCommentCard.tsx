"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Profile { username: string; avatar_url: string | null; }

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  profiles: Profile | null;
  replies?: Comment[];
  // recipe / blog link
  recipes?: { title: string; slug: string } | null;
  blog_posts?: { title: string; slug: string } | null;
}

interface Props {
  comment: Comment;
  type: "recipe" | "blog";
  // endpoint to post reply: /api/recipes/[recipeId]/comments or /api/blog/[postId]/comments
  replyEndpoint: string;
}

export default function AdminCommentCard({ comment, type, replyEndpoint }: Props) {
  const router   = useRouter();
  const [open,   setOpen]   = useState(false);
  const [text,   setText]   = useState("");
  const [saving, setSaving] = useState(false);

  const linkHref = type === "recipe"
    ? (comment.recipes  ? `/tarifler/${comment.recipes.slug}`  : null)
    : (comment.blog_posts ? `/blog/${comment.blog_posts.slug}` : null);
  const linkLabel = type === "recipe"
    ? (comment.recipes?.title  ?? null)
    : (comment.blog_posts?.title ?? null);
  const linkEmoji = type === "recipe" ? "🍽️" : "✍️";

  async function sendReply() {
    if (!text.trim()) return;
    setSaving(true);
    await fetch(replyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim(), parent_id: comment.id }),
    });
    setSaving(false);
    setText("");
    setOpen(false);
    router.refresh();
  }

  async function deleteComment(id: string) {
    await fetch(`/api/admin/yorumlar`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: id, type }),
    });
    router.refresh();
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-warm-800">{comment.profiles?.username ?? "Silinmiş kullanıcı"}</span>
            <span className="text-xs text-warm-400">{fmtDate(comment.created_at)}</span>
            {linkHref && linkLabel && (
              <a href={linkHref} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline truncate max-w-[200px]">
                {linkEmoji} {linkLabel}
              </a>
            )}
          </div>
          <p className="text-sm text-warm-700 leading-relaxed">{comment.content}</p>

          {/* Yanıtlar */}
          {(comment.replies ?? []).length > 0 && (
            <div className="mt-3 ml-4 space-y-2 border-l-2 border-warm-100 pl-3">
              {(comment.replies ?? []).map(r => (
                <div key={r.id} className="group flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-warm-700">{r.profiles?.username ?? "Üye"}</span>
                    <span className="text-[11px] text-warm-400 ml-2">{fmtDate(r.created_at)}</span>
                    <p className="text-xs text-warm-600 mt-0.5 leading-relaxed">{r.content}</p>
                  </div>
                  <button onClick={() => deleteComment(r.id)}
                    className="text-[11px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Admin yanıt formu */}
          {open ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={2}
                placeholder="Admin olarak yanıtlayın…"
                className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 text-warm-600 text-xs hover:bg-warm-50 transition-colors">
                  İptal
                </button>
                <button onClick={sendReply} disabled={!text.trim() || saving}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors">
                  {saving ? "Gönderiliyor…" : "Yanıtla"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setOpen(true)}
              className="mt-2 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors">
              ↩ Yanıtla
            </button>
          )}
        </div>
        <button onClick={() => deleteComment(comment.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          Sil
        </button>
      </div>
    </div>
  );
}
