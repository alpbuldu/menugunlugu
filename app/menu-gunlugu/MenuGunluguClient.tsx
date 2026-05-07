"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import type { MenuRecipe } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlimRecipe {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  kcal_per_person?: number | null;
}

interface FeedPost {
  id: string;
  user_id: string;
  created_at: string;
  soup_title: string | null;
  main_title: string | null;
  side_title: string | null;
  dessert_title: string | null;
  soup_slug: string | null;
  main_slug: string | null;
  side_slug: string | null;
  dessert_slug: string | null;
  soup_image_url: string | null;
  main_image_url: string | null;
  side_image_url: string | null;
  dessert_image_url: string | null;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  category: string | null;
  author: { username: string; avatar_url: string | null };
  // client-side state
  liked?: boolean;
  saved?: boolean;
}

interface Comment {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  author: { username: string; avatar_url: string | null };
}

interface AdminMenu {
  id: string;
  menu_category: string;
  date: string;
  soup: SlimRecipe | null;
  main: SlimRecipe | null;
  side: SlimRecipe | null;
  dessert: SlimRecipe | null;
}

interface TodayMenu {
  id: string;
  date: string;
  soup: SlimRecipe | null;
  main: SlimRecipe | null;
  side: SlimRecipe | null;
  dessert: SlimRecipe | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı", dessert: "Tatlı",
};

const MENU_CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  "kahvalti":     { label: "Kahvaltı",      emoji: "☕" },
  "akdeniz":      { label: "Akdeniz",       emoji: "🫒" },
  "et":           { label: "Et Menüsü",     emoji: "🥩" },
  "vejetaryen":   { label: "Vejetaryen",    emoji: "🥦" },
  "deniz":        { label: "Deniz Ürünleri",emoji: "🦐" },
  "klasik":       { label: "Klasik Türk",   emoji: "🍲" },
  "hafif":        { label: "Hafif",         emoji: "🥗" },
  "pratik":       { label: "Pratik",        emoji: "⚡" },
};

const CELL_CONFIGS = [
  { key: "soup"    as const, label: "Çorba",    titleKey: "soup_title"    as const, imgKey: "soup_image_url"    as const, slugKey: "soup_slug"    as const },
  { key: "main"    as const, label: "Ana",      titleKey: "main_title"    as const, imgKey: "main_image_url"    as const, slugKey: "main_slug"    as const },
  { key: "side"    as const, label: "Yardımcı", titleKey: "side_title"    as const, imgKey: "side_image_url"    as const, slugKey: "side_slug"    as const },
  { key: "dessert" as const, label: "Tatlı",    titleKey: "dessert_title" as const, imgKey: "dessert_image_url" as const, slugKey: "dessert_slug" as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return <img src={url} alt={name} style={{ width: s, height: s }} className="rounded-full object-cover flex-shrink-0" />;
  return (
    <span style={{ width: s, height: s }}
      className="rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {name.charAt(0)}
    </span>
  );
}

// ─── Comment Drawer ───────────────────────────────────────────────────────────

function CommentDrawer({ postId, onClose, onCommentAdded }: {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/menu-gunlugu/comment?post_id=${postId}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [postId]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/menu-gunlugu/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: text.trim() }),
      });
      if (res.status === 401) { alert("Yorum yapmak için giriş yapın"); return; }
      if (!res.ok) return;
      const c = await res.json();
      setComments(prev => [...prev, c]);
      setText("");
      onCommentAdded();
    } finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-xl flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-warm-200 rounded-full" />
        </div>
        <div className="px-4 pb-2 flex items-center justify-between">
          <p className="font-bold text-warm-900 text-sm">Yorumlar ({comments.length})</p>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 text-lg leading-none">×</button>
        </div>
        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
          {loading && <p className="text-center py-6 text-warm-400 text-sm">Yükleniyor…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-center py-6 text-warm-400 text-sm">Henüz yorum yok. İlk yorumu sen yap!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar url={c.author.avatar_url} name={c.author.username} size={28} />
              <div className="bg-warm-50 rounded-2xl px-3 py-2 flex-1 min-w-0">
                <p className="text-xs font-bold text-warm-700">@{c.author.username}</p>
                <p className="text-sm text-warm-800 mt-0.5 break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="border-t border-warm-100 px-4 py-3 flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Yorum yaz…"
            className="flex-1 px-3 py-2 rounded-xl bg-warm-50 border border-warm-200 text-sm text-warm-800 placeholder:text-warm-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-200"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-brand-700 transition-colors">
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────

function FeedCard({ post, onLike, onSave, onComment }: {
  post: FeedPost;
  onLike: (id: string, liked: boolean) => void;
  onSave: (id: string, saved: boolean) => void;
  onComment: (id: string) => void;
}) {
  const [likeCount, setLikeCount]     = useState(post.likes_count);
  const [saveCount, setSaveCount]     = useState(post.saves_count);
  const [commentCount, setCommentCount] = useState(post.comments_count ?? 0);
  const [liked, setLiked]             = useState(post.liked ?? false);
  const [saved, setSaved]             = useState(post.saved ?? false);
  const [likeBusy, setLikeBusy]       = useState(false);
  const [saveBusy, setSaveBusy]       = useState(false);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => c + (newLiked ? 1 : -1));
    try {
      if (newLiked) {
        await fetch("/api/menu-gunlugu/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: post.id }) });
      } else {
        await fetch(`/api/menu-gunlugu/like?post_id=${post.id}`, { method: "DELETE" });
      }
      onLike(post.id, newLiked);
    } catch {
      setLiked(!newLiked);
      setLikeCount(c => c + (newLiked ? -1 : 1));
    } finally { setLikeBusy(false); }
  }

  async function toggleSave() {
    if (saveBusy) return;
    setSaveBusy(true);
    const newSaved = !saved;
    setSaved(newSaved);
    setSaveCount(c => c + (newSaved ? 1 : -1));
    try {
      if (newSaved) {
        await fetch("/api/menu-gunlugu/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: post.id }) });
      } else {
        await fetch(`/api/menu-gunlugu/save?post_id=${post.id}`, { method: "DELETE" });
      }
      onSave(post.id, newSaved);
    } catch {
      setSaved(!newSaved);
      setSaveCount(c => c + (newSaved ? -1 : 1));
    } finally { setSaveBusy(false); }
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: "Menü Günlüğü", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <Avatar url={post.author.avatar_url} name={post.author.username} size={34} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-warm-800 truncate">@{post.author.username}</p>
          <p className="text-[11px] text-warm-400">{timeAgo(post.created_at)}</p>
        </div>
        {post.category && (
          <span className="text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full flex-shrink-0">
            {CAT_LABELS[post.category] ?? post.category}
          </span>
        )}
      </div>

      {/* 2×2 image grid */}
      <div className="grid grid-cols-2 gap-px bg-warm-100">
        {CELL_CONFIGS.map(cfg => {
          const title = post[cfg.titleKey];
          const img   = post[cfg.imgKey];
          const slug  = post[cfg.slugKey];
          const inner = (
            <div className="relative aspect-square bg-warm-50">
              {img ? (
                <Image src={img} alt={title ?? cfg.label} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl bg-warm-100">🍽️</div>
              )}
              {/* Category label — top left */}
              <div className="absolute top-0 left-0 bg-black/55 px-1.5 py-0.5">
                <p className="text-[9px] text-white font-semibold">{cfg.label}</p>
              </div>
              {/* Title — bottom */}
              {title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-4">
                  <p className="text-white text-[10px] font-semibold leading-snug line-clamp-2">{title}</p>
                </div>
              )}
            </div>
          );
          if (slug) return (
            <Link key={cfg.key} href={`/tarifler/${slug}`} className="block hover:opacity-90 transition-opacity">
              {inner}
            </Link>
          );
          return <div key={cfg.key}>{inner}</div>;
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Like */}
        <button onClick={toggleLike}
          className={`flex items-center gap-1 transition-colors ${liked ? "text-rose-500" : "text-warm-400 hover:text-rose-400"}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-xs font-semibold">{likeCount > 0 ? likeCount : ""}</span>
        </button>

        {/* Comment */}
        <button onClick={() => onComment(post.id)}
          className="flex items-center gap-1 text-warm-400 hover:text-brand-500 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-xs font-semibold">{commentCount > 0 ? commentCount : ""}</span>
        </button>

        {/* Save */}
        <button onClick={toggleSave}
          className={`flex items-center gap-1 transition-colors ${saved ? "text-brand-600" : "text-warm-400 hover:text-brand-500"}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-xs font-semibold">{saveCount > 0 ? saveCount : ""}</span>
        </button>

        <div className="flex-1" />

        {/* Share */}
        <button onClick={share} className="text-warm-400 hover:text-warm-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Admin Menu Card (horizontal scroll) ──────────────────────────────────────

function AdminMenuCard({ menu }: { menu: AdminMenu }) {
  const catInfo = MENU_CATEGORY_LABELS[menu.menu_category] ?? { label: menu.menu_category, emoji: "🍽️" };
  const cells = [
    { r: menu.soup,    label: "Çorba" },
    { r: menu.main,    label: "Ana" },
    { r: menu.side,    label: "Yardımcı" },
    { r: menu.dessert, label: "Tatlı" },
  ].filter(c => c.r);

  return (
    <div className="flex-shrink-0 w-52 bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      {/* Category badge */}
      <div className="bg-brand-50 px-3 py-2 flex items-center gap-1.5">
        <span className="text-sm">{catInfo.emoji}</span>
        <span className="text-xs font-bold text-brand-700">{catInfo.label}</span>
      </div>
      {/* Grid — 2 cols if 4 items */}
      <div className={`grid ${cells.length === 4 ? "grid-cols-2" : "grid-cols-1"} gap-px bg-warm-100`}>
        {cells.map(({ r, label }) => r && (
          <Link key={r.id} href={`/tarifler/${r.slug}`} className="block relative aspect-square bg-warm-50 hover:opacity-90 transition-opacity">
            {r.image_url ? (
              <Image src={r.image_url} alt={r.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl bg-warm-100">🍽️</div>
            )}
            <div className="absolute top-0 left-0 bg-black/55 px-1 py-0.5">
              <p className="text-[8px] text-white font-semibold">{label}</p>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-3">
              <p className="text-white text-[9px] font-semibold leading-snug line-clamp-2">{r.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ALL_CAT_FILTERS = [
  { key: "all", label: "Tümü" },
  ...Object.entries(MENU_CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v.label })),
];

export default function MenuGunluguClient({
  grouped,
  todayMenu,
  initialFeed,
  adminMenus,
  adminProfile,
}: {
  grouped: Record<Category, MenuRecipe[]>;
  todayMenu: TodayMenu | null;
  initialFeed: FeedPost[];
  adminMenus: AdminMenu[];
  adminProfile: { username: string; avatar_url: string | null } | null;
}) {
  const [feed, setFeed]               = useState<FeedPost[]>(initialFeed);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(initialFeed.length === 20);
  const [catFilter, setCatFilter]     = useState("all");
  const [commentPost, setCommentPost] = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  // Fetch user like/save state for initial feed
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || feed.length === 0) return;
      const ids = feed.map(p => p.id);
      Promise.all([
        supabase.from("menu_feed_likes").select("post_id").eq("user_id", user.id).in("post_id", ids),
        supabase.from("menu_feed_saves").select("post_id").eq("user_id", user.id).in("post_id", ids),
      ]).then(([likeRes, saveRes]) => {
        const likedSet = new Set((likeRes.data ?? []).map((r: any) => r.post_id));
        const savedSet = new Set((saveRes.data ?? []).map((r: any) => r.post_id));
        setFeed(prev => prev.map(p => ({
          ...p,
          liked: likedSet.has(p.id),
          saved: savedSet.has(p.id),
        })));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function loadMore() {
    if (loading) return;
    const next = page + 1;
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-gunlugu/feed?page=${next}`);
      const data: FeedPost[] = await res.json();
      setFeed(f => [...f, ...data]);
      setPage(next);
      if (data.length < 20) setHasMore(false);
    } finally { setLoading(false); }
  }

  function handleLike(id: string, liked: boolean) {
    setFeed(prev => prev.map(p => p.id === id ? { ...p, liked, likes_count: p.likes_count + (liked ? 1 : -1) } : p));
  }
  function handleSave(id: string, saved: boolean) {
    setFeed(prev => prev.map(p => p.id === id ? { ...p, saved, saves_count: p.saves_count + (saved ? 1 : -1) } : p));
  }
  function handleCommentAdded() {
    if (commentPost) {
      setFeed(prev => prev.map(p => p.id === commentPost ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p));
    }
  }

  const filteredAdminMenus = catFilter === "all"
    ? adminMenus
    : adminMenus.filter(m => m.menu_category === catFilter);

  const totalKcal = todayMenu
    ? [todayMenu.soup, todayMenu.main, todayMenu.side, todayMenu.dessert]
        .reduce((s, r) => s + ((r as any)?.kcal_per_person ?? 0), 0)
    : 0;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warm-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* Comment drawer */}
      {commentPost && (
        <CommentDrawer
          postId={commentPost}
          onClose={() => setCommentPost(null)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* ── Başlık ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900">Menü Günlüğü 📔</h1>
        {feed.length > 0 && (
          <span className="text-xs font-semibold text-warm-400 bg-warm-100 px-2 py-1 rounded-full">
            {feed.length}+ paylaşım
          </span>
        )}
      </div>

      {/* ── Bugünün Resmi Menüsü ── */}
      {todayMenu && (
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-4 shadow-md mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-brand-200 text-[11px] font-semibold uppercase tracking-wider">Bugünün Resmi Menüsü</p>
              <p className="text-white font-bold text-sm capitalize">
                {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" })}
              </p>
            </div>
            {totalKcal > 0 && (
              <span className="text-brand-200 text-xs font-semibold">{totalKcal} kcal</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { r: todayMenu.soup,    e: "🥣", l: "Çorba" },
              { r: todayMenu.main,    e: "🍽️", l: "Ana Yemek" },
              { r: todayMenu.side,    e: "🥗", l: "Yardımcı" },
              { r: todayMenu.dessert, e: "🍮", l: "Tatlı" },
            ].map(({ r, e, l }) => (
              <div key={l} className="bg-white/10 rounded-xl p-2.5">
                <p className="text-brand-200 text-[10px] font-medium mb-0.5">{e} {l}</p>
                <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{r?.title ?? "—"}</p>
                {(r as any)?.kcal_per_person ? <p className="text-brand-300 text-[10px] mt-0.5">{(r as any).kcal_per_person} kcal</p> : null}
              </div>
            ))}
          </div>
          <Link href="/gunun-menusu"
            className="block w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center transition-colors">
            Günün Menüsünü Gör →
          </Link>
        </div>
      )}

      {/* ── Kendi Menünü Oluştur Banner ── */}
      <Link href="/menu-olustur"
        className="block bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-4 mb-5 hover:opacity-95 transition-opacity shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-extrabold text-sm">Kendi Menünü Oluştur ve Paylaş ✨</p>
            <p className="text-brand-100 text-xs mt-0.5">Tarif seç • Görsel oluştur • Akışa paylaş</p>
          </div>
          <span className="text-white text-xl flex-shrink-0">→</span>
        </div>
      </Link>

      {/* ── Editörün Menü Önerileri ── */}
      {adminMenus.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-warm-800">Editörün Menü Önerileri</h2>
            <span className="text-[11px] text-warm-400">Menü Günlüğü Editörü</span>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 [&::-webkit-scrollbar]:hidden">
            {ALL_CAT_FILTERS.filter(f => f.key === "all" || adminMenus.some(m => m.menu_category === f.key)).map(f => (
              <button key={f.key}
                onClick={() => setCatFilter(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  catFilter === f.key
                    ? "bg-brand-600 text-white"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {filteredAdminMenus.map(m => (
              <AdminMenuCard key={m.id} menu={m} />
            ))}
            {filteredAdminMenus.length === 0 && (
              <p className="text-sm text-warm-400 py-4">Bu kategoride menü yok</p>
            )}
          </div>
        </div>
      )}

      {/* ── Menü Günlüğü Akışı ── */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-extrabold text-warm-800">Menü Günlüğü Akışı</h2>
        <div className="flex-1 h-px bg-warm-100" />
      </div>

      <div className="space-y-3">
        {feed.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📔</p>
            <p className="text-sm text-warm-500 mb-1">Henüz paylaşım yok</p>
            <p className="text-xs text-warm-400">İlk menüyü paylaşan sen ol!</p>
          </div>
        )}

        {feed.map(p => (
          <FeedCard
            key={p.id}
            post={p}
            onLike={handleLike}
            onSave={handleSave}
            onComment={(id) => setCommentPost(id)}
          />
        ))}

        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl border border-warm-200 transition-colors disabled:opacity-50">
            {loading ? "Yükleniyor…" : "Daha fazla göster"}
          </button>
        )}
      </div>
    </div>
  );
}
