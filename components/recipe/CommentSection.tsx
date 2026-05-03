"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface Props {
  recipeId: string;
  currentUserId?: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// Başındaki @mention'ı ayır — header'da gösterilince içerikten temizlenir
function parseReplyContent(content: string, parentAuthor: string): { target: string; body: string } {
  const m = content.match(/^@(\S+)\s*/);
  if (m) return { target: m[1], body: content.slice(m[0].length) };
  return { target: parentAuthor, body: content };
}

// İçerikteki @mention'ları renklendir
function RenderContent({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className="text-sm text-warm-700 mt-0.5 leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} className="font-semibold text-brand-600">{part}</span>
          : part
      )}
    </p>
  );
}

function Avatar({ profile }: { profile: Comment["profiles"] }) {
  return (
    <div className="w-8 h-8 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0 mt-0.5">
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt={profile.username} width={32} height={32} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs">👤</span>
      )}
    </div>
  );
}

export default function CommentSection({ recipeId, currentUserId }: Props) {
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [text,        setText]        = useState("");
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState("");
  const [replyTo,     setReplyTo]     = useState<{ id: string; username: string } | null>(null);
  const [replyText,   setReplyText]   = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const replyRefs  = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    fetch(`/api/recipes/${recipeId}/comments`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }, [recipeId]);

  async function postComment(content: string, parentId: string | null) {
    const res  = await fetch(`/api/recipes/${recipeId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), parent_id: parentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
    return data.comment as Comment;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true); setError("");
    try {
      const c = await postComment(text, null);
      setComments(prev => [...prev, c]);
      setText("");
      window.dispatchEvent(new CustomEvent("recipe-comment-posted", { detail: { recipeId } }));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleReplySubmit(parentId: string) {
    const content = (replyText[parentId] ?? "").trim();
    if (!content) return;
    setSendingReply(parentId);
    try {
      const c = await postComment(content, parentId);
      setComments(prev => [...prev, c]);
      setReplyText(prev => ({ ...prev, [parentId]: "" }));
      setReplyTo(null);
    } catch {
      // silently fail
    } finally {
      setSendingReply(null);
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/recipes/${recipeId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  }

  function openReply(commentId: string, username: string) {
    setReplyTo({ id: commentId, username });
    // textarea'ya @kullanıcı ile başlat
    setReplyText(prev => ({ ...prev, [commentId]: `@${username} ` }));
    setTimeout(() => {
      const el = replyRefs.current[commentId];
      if (!el) return;
      el.focus();
      // imleci sona taşı
      const len = (`@${username} `).length;
      el.setSelectionRange(len, len);
    }, 50);
  }

  const topLevel = comments.filter(c => !c.parent_id);
  const repliesFor = (id: string) => comments.filter(c => c.parent_id === id);
  const totalCount = comments.length;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">💬</span>
        Yorumlar {totalCount > 0 && <span className="text-warm-400 font-normal text-base">({totalCount})</span>}
      </h2>

      {/* Yorum listesi */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-warm-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-warm-100 rounded w-24" />
                <div className="h-3 bg-warm-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-warm-400 py-4">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
      ) : (
        <div className="space-y-5 mb-6">
          {topLevel.map(c => {
            const replies = repliesFor(c.id);
            const isReplying = replyTo?.id === c.id;
            return (
              <div key={c.id}>
                {/* Ana yorum */}
                <div className="flex gap-3 group">
                  <Avatar profile={c.profiles} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-warm-800">{c.profiles?.username ?? "Üye"}</span>
                      <span className="text-xs text-warm-400">{formatDate(c.created_at)}</span>
                      {currentUserId === c.user_id && (
                        <button onClick={() => handleDelete(c.id)}
                          className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          Sil
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-warm-700 mt-0.5 leading-relaxed">{c.content}</p>
                    {currentUserId && (
                      <button
                        onClick={() => isReplying ? setReplyTo(null) : openReply(c.id, c.profiles?.username ?? "Üye")}
                        className="mt-1.5 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
                      >
                        {isReplying ? "İptal" : "↩ Yanıtla"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Yanıtlar */}
                {replies.length > 0 && (
                  <div className="ml-11 mt-3 space-y-3 border-l-2 border-warm-100 pl-4">
                    {replies.map(r => {
                      const parentAuthor = c.profiles?.username ?? "Üye";
                      // @mention yoksa parent yorum sahibini öne ekle (kendi kendine etiket engeli)
                      const displayContent = (() => {
                        if (r.content.match(/^@\S+/)) {
                          const m = r.content.match(/^@(\S+)/);
                          const mentioned = m?.[1] ?? "";
                          // Kendi yorumunu yanıtlıyorsa @mention'ı gösterme
                          if (mentioned === r.profiles?.username) {
                            return r.content.replace(/^@\S+\s*/, "");
                          }
                          return r.content;
                        }
                        // @mention yok — self-reply ise ekleme
                        if (parentAuthor === r.profiles?.username) return r.content;
                        return `@${parentAuthor} ${r.content}`;
                      })();
                      return (
                        <div key={r.id} className="flex gap-2.5 group">
                          <div className="w-6 h-6 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0 mt-0.5">
                            {r.profiles?.avatar_url ? (
                              <Image src={r.profiles.avatar_url} alt={r.profiles.username} width={24} height={24} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px]">👤</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-warm-800">{r.profiles?.username ?? "Üye"}</span>
                              <span className="text-[11px] text-warm-400">{formatDate(r.created_at)}</span>
                              {currentUserId === r.user_id && (
                                <button onClick={() => handleDelete(r.id)}
                                  className="text-[11px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                  Sil
                                </button>
                              )}
                            </div>
                            <RenderContent text={displayContent} />
                            {currentUserId && (
                              <button
                                onClick={() => isReplying ? setReplyTo(null) : openReply(c.id, r.profiles?.username ?? "Üye")}
                                className="mt-1 text-[11px] text-brand-500 hover:text-brand-700 font-medium transition-colors"
                              >
                                ↩ Yanıtla
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Yanıt formu */}
                {isReplying && currentUserId && (
                  <div className="ml-11 mt-3 flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px]">👤</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        ref={el => { replyRefs.current[c.id] = el; }}
                        value={replyText[c.id] ?? ""}
                        onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder={`@${replyTo.username} yanıtını yaz…`}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-warm-200 bg-white text-warm-800 placeholder-warm-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setReplyTo(null)}
                          className="px-3 py-1.5 rounded-lg border border-warm-200 text-warm-600 text-xs font-medium hover:bg-warm-50 transition-colors">
                          İptal
                        </button>
                        <button
                          onClick={() => handleReplySubmit(c.id)}
                          disabled={!replyText[c.id]?.trim() || sendingReply === c.id}
                          className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                        >
                          {sendingReply === c.id ? "Gönderiliyor…" : "Yanıtla"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Yeni yorum formu */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-warm-100">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">👤</span>
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Yorumunuzu yazın…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 placeholder-warm-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none transition-shadow"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={sending || !text.trim()}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {sending ? "Gönderiliyor…" : "Yorum Yap"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="pt-4 border-t border-warm-100 text-center py-6">
          <p className="text-sm text-warm-500">
            Yorum yapmak için{" "}
            <Link href="/giris" className="text-brand-600 font-medium hover:underline">giriş yapın</Link>
          </p>
        </div>
      )}
    </section>
  );
}
