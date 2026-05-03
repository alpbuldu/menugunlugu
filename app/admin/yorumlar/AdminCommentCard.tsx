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
  recipes?: { title: string; slug: string } | null;
  blog_posts?: { title: string; slug: string } | null;
}

interface Props {
  comment: Comment;
  type: "recipe" | "blog";
  replyEndpoint: string;
}

function RenderContent({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className="text-sm text-warm-700 leading-relaxed mt-0.5">
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="font-semibold text-brand-600">{part}</span>
          : part
      )}
    </p>
  );
}

export default function AdminCommentCard({ comment, type, replyEndpoint }: Props) {
  const router = useRouter();

  // replyingTo: hangi yorumu yanıtlıyoruz (id + username)
  // null → form kapalı, comment.id → ana yoruma yanıt, r.id → yanıta yanıt
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [text,   setText]   = useState("");
  const [saving, setSaving] = useState(false);

  const linkHref  = type === "recipe"
    ? (comment.recipes   ? `/tarifler/${comment.recipes.slug}`  : null)
    : (comment.blog_posts ? `/blog/${comment.blog_posts.slug}`   : null);
  const linkLabel = type === "recipe"
    ? (comment.recipes?.title   ?? null)
    : (comment.blog_posts?.title ?? null);
  const linkEmoji = type === "recipe" ? "🍽️" : "✍️";

  function openReply(targetCommentId: string, username: string) {
    setReplyingTo({ commentId: targetCommentId, username });
    setText(`@${username} `);
  }

  function closeReply() {
    setReplyingTo(null);
    setText("");
  }

  async function sendReply() {
    if (!text.trim() || !replyingTo) return;
    setSaving(true);
    await fetch(replyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // parent_id her zaman üst yorum (comment.id) — flat 2-level threading
      body: JSON.stringify({ content: text.trim(), parent_id: comment.id }),
    });
    setSaving(false);
    closeReply();
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

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

  const replyForm = (
    <div className="mt-2 space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        autoFocus
        className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={closeReply}
          className="px-3 py-1.5 rounded-lg border border-warm-200 text-warm-600 text-xs hover:bg-warm-50 transition-colors">
          İptal
        </button>
        <button onClick={sendReply} disabled={!text.trim() || saving}
          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors">
          {saving ? "Gönderiliyor…" : "Yanıtla"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">

          {/* Ana yorum başlık */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-warm-800">
              {comment.profiles?.username ?? "Silinmiş kullanıcı"}
            </span>
            <span className="text-xs text-warm-400">{fmtDate(comment.created_at)}</span>
            {linkHref && linkLabel && (
              <a href={linkHref} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline truncate max-w-[200px]">
                {linkEmoji} {linkLabel}
              </a>
            )}
          </div>

          {/* Ana yorum içeriği */}
          <RenderContent text={comment.content} />

          {/* Ana yoruma yanıt butonu */}
          {replyingTo?.commentId !== comment.id && (
            <button
              onClick={() => openReply(comment.id, comment.profiles?.username ?? "Üye")}
              className="mt-1.5 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors">
              ↩ Yanıtla
            </button>
          )}
          {replyingTo?.commentId === comment.id && replyForm}

          {/* Yanıtlar */}
          {(comment.replies ?? []).length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-warm-100 pl-3">
              {(comment.replies ?? []).map(r => {
                const parentAuthor = comment.profiles?.username ?? "Üye";
                const displayContent = r.content.match(/^@\S+/)
                  ? r.content
                  : `@${parentAuthor} ${r.content}`;
                const isReplyingToThis = replyingTo?.commentId === r.id;
                return (
                  <div key={r.id} className="group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-warm-700">
                            {r.profiles?.username ?? "Üye"}
                          </span>
                          <span className="text-[11px] text-warm-400">{fmtDate(r.created_at)}</span>
                        </div>
                        <RenderContent text={displayContent} />

                        {/* Yanıta yanıt butonu */}
                        {!isReplyingToThis && (
                          <button
                            onClick={() => openReply(r.id, r.profiles?.username ?? "Üye")}
                            className="mt-1 text-[11px] text-brand-500 hover:text-brand-700 font-medium transition-colors">
                            ↩ Yanıtla
                          </button>
                        )}
                        {isReplyingToThis && replyForm}
                      </div>
                      <button
                        onClick={() => deleteComment(r.id)}
                        className="text-[11px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Ana yorumu sil */}
        <button onClick={() => deleteComment(comment.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          Sil
        </button>
      </div>
    </div>
  );
}
