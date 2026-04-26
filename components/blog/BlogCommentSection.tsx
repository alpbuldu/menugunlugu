"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface Props {
  postId: string;
  currentUserId?: string | null;
}

export default function BlogCommentSection({ postId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/blog/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");

    const res  = await fetch(`/api/blog/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) { setError(data.error ?? "Yorum gönderilemedi."); return; }
    setComments((prev) => [...prev, data.comment]);
    setText("");
    window.dispatchEvent(new CustomEvent("blog-comment-posted", { detail: { postId } }));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/blog/${postId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">💬</span>
        Yorumlar {comments.length > 0 && <span className="text-warm-400 font-normal text-base">({comments.length})</span>}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-warm-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-warm-100 rounded w-24" />
                <div className="h-3 bg-warm-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-warm-400 py-4">
          Henüz yorum yapılmamış. İlk yorumu sen yap!
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0 mt-0.5">
                {c.profiles?.avatar_url ? (
                  <Image src={c.profiles.avatar_url} alt={c.profiles.username} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs">👤</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-warm-800">
                    {c.profiles?.username ?? "Üye"}
                  </span>
                  <span className="text-xs text-warm-400">{formatDate(c.created_at)}</span>
                  {currentUserId === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      Sil
                    </button>
                  )}
                </div>
                <p className="text-sm text-warm-700 mt-0.5 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-warm-100">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">👤</span>
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Yorumunuzu yazın…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 placeholder-warm-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none transition-shadow"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {sending ? "Gönderiliyor…" : "Yorum Yap"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="pt-4 border-t border-warm-100 text-center py-6">
          <p className="text-sm text-warm-500">
            Yorum yapmak için{" "}
            <Link href="/giris" className="text-brand-600 font-medium hover:underline">
              giriş yapın
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
