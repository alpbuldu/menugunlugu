"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  recipeId: string;
  recipeTitle: string;
  commentCount: number;
  favoriteCount: number;
  avgRating: number;
  ratingCount: number;
  followerCount: number;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  targetUserId?: string;
  isAdminProfile: boolean;
  initialFollowing: boolean;
}

/* ── SVG ikonlar — tek renk çizgi stili ── */
const icons = {
  comment: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  follow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  following: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  heartFilled: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ── Tek hücre ── */
function Cell({
  icon, count, label, sub, onClick, href, active,
}: {
  icon: React.ReactNode;
  count?: string | number;
  label: string;
  sub?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const color = active ? "text-brand-600" : "text-warm-400";
  const inner = (
    <span className="flex flex-col items-center gap-1">
      <span className={`transition-colors ${color}`}>{icon}</span>
      {count !== undefined && (
        <span className="text-[11px] font-semibold text-warm-700 leading-none tabular-nums">{count}</span>
      )}
      <span className="text-[10px] text-warm-400 leading-none">{label}</span>
      {sub && <span className="mt-0.5">{sub}</span>}
    </span>
  );

  const base = "flex-1 flex items-center justify-center py-3.5 hover:bg-warm-50 transition-colors rounded-lg";

  if (href) return <a href={href} className={base}>{inner}</a>;
  return <button type="button" onClick={onClick} className={base}>{inner}</button>;
}

function Sep() {
  return <div className="w-px bg-warm-100 my-3 flex-shrink-0" />;
}

/* ── Ana component ── */
export default function RecipeActionBar({
  recipeId, recipeTitle,
  commentCount, favoriteCount, avgRating, ratingCount, followerCount,
  initialFavorited, isLoggedIn,
  targetUserId, isAdminProfile, initialFollowing,
}: Props) {
  const [favorited,  setFavorited]  = useState(initialFavorited);
  const [favCount,   setFavCount]   = useState(favoriteCount);
  const [favSaving,  setFavSaving]  = useState(false);
  const [following,  setFollowing]  = useState(initialFollowing);
  const [follCount,  setFollCount]  = useState(followerCount);
  const [copied,     setCopied]     = useState(false);
  const [isPending,  startTransition] = useTransition();
  const router = useRouter();

  const myId = isAdminProfile ? "__admin__" : (targetUserId ?? null);

  /* Dış follow eventleri */
  useEffect(() => {
    if (!myId) return;
    function onFollow(e: Event) {
      const { id, following: val } = (e as CustomEvent<{ id: string; following: boolean }>).detail;
      if (id !== myId) return;
      setFollowing(val);
      setFollCount(c => val ? c + 1 : Math.max(0, c - 1));
    }
    window.addEventListener("follow-change", onFollow);
    return () => window.removeEventListener("follow-change", onFollow);
  }, [myId]);

  /* Dış favorite eventleri */
  useEffect(() => {
    function onFav(e: Event) {
      const { recipeId: id, favorited: val } = (e as CustomEvent).detail;
      if (id !== recipeId) return;
      setFavorited(val);
      setFavCount(c => val ? c + 1 : Math.max(0, c - 1));
    }
    window.addEventListener("favorite-changed", onFav);
    return () => window.removeEventListener("favorite-changed", onFav);
  }, [recipeId]);

  /* Takip et */
  function handleFollow() {
    if (!isLoggedIn) { router.push(`/giris?from=${encodeURIComponent(window.location.pathname)}`); return; }
    const optimistic = !following;
    setFollowing(optimistic);
    setFollCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    const evDetail = { id: myId, following: optimistic };
    window.dispatchEvent(new CustomEvent("follow-change", { detail: evDetail }));
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel("follow-state");
      ch.postMessage(evDetail); ch.close();
    }
    startTransition(async () => {
      try {
        const body = isAdminProfile ? { is_admin: true } : { following_id: targetUserId };
        const res  = await fetch("/api/member/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) {
          const data = await res.json();
          const confirmed = data.following as boolean;
          if (confirmed !== optimistic) {
            setFollowing(confirmed);
            setFollCount(c => confirmed ? c + 1 : Math.max(0, c - 1));
            window.dispatchEvent(new CustomEvent("follow-change", { detail: { id: myId, following: confirmed } }));
          }
          setTimeout(() => router.refresh(), 600);
        } else { setFollowing(!optimistic); setFollCount(c => optimistic ? Math.max(0, c - 1) : c + 1); }
      } catch { setFollowing(!optimistic); setFollCount(c => optimistic ? Math.max(0, c - 1) : c + 1); }
    });
  }

  /* Deftere ekle */
  async function toggleFavorite() {
    if (!isLoggedIn) { router.push(`/giris?from=${encodeURIComponent(window.location.pathname)}`); return; }
    if (favSaving) return;
    setFavSaving(true);
    const optimistic = !favorited;
    setFavorited(optimistic);
    setFavCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    try {
      const res  = await fetch(`/api/recipes/${recipeId}/favorites`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const confirmed = data.favorited as boolean;
        if (confirmed !== optimistic) { setFavorited(confirmed); setFavCount(c => confirmed ? c + 1 : Math.max(0, c - 1)); }
        window.dispatchEvent(new CustomEvent("favorite-changed", { detail: { recipeId, favorited: confirmed } }));
      } else { setFavorited(!optimistic); setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1); }
    } catch { setFavorited(!optimistic); setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1); }
    finally { setFavSaving(false); }
  }

  /* Paylaş */
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: recipeTitle, url }); return; } catch { return; } }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ratingDisplay = ratingCount > 0 ? `${avgRating.toFixed(1)} · ${fmt(ratingCount)}` : "–";

  return (
    <div className="bg-white border-b border-warm-100 px-1">
      <div className="flex items-stretch">

        <Cell
          icon={icons.comment}
          count={fmt(commentCount)}
          label="Yorum"
          href="#yorumlar"
        />

        <Sep />

        <Cell
          icon={following ? icons.following : icons.follow}
          count={fmt(follCount)}
          label={following ? "Takipte" : "Takip Et"}
          onClick={handleFollow}
          active={following}
        />

        <Sep />

        <Cell
          icon={icons.star}
          count={ratingDisplay}
          label="Puan"
          href="#puan"
        />

        <Sep />

        <Cell
          icon={favorited ? icons.heartFilled : icons.heart}
          count={fmt(favCount)}
          label={favorited ? "Defterde" : "Deftere Ekle"}
          onClick={toggleFavorite}
          active={favorited}
          sub={favorited && isLoggedIn ? (
            <Link
              href="/uye/panel?tab=tarif-defterim"
              onClick={e => e.stopPropagation()}
              className="text-[9px] text-brand-500 hover:underline leading-none"
            >
              Defterini gör →
            </Link>
          ) : undefined}
        />

        <Sep />

        <Cell
          icon={copied ? icons.check : icons.share}
          label={copied ? "Kopyalandı" : "Paylaş"}
          onClick={handleShare}
          active={copied}
        />

      </div>
    </div>
  );
}
