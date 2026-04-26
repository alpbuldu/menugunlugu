"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FollowButton from "@/components/ui/FollowButton";

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

/* ── SVG ikonlar ── */
function IconComment() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconFollow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ── Tek bir aksiyon hücresi ── */
function Cell({
  icon,
  stat,
  label,
  onClick,
  href,
  active,
}: {
  icon: React.ReactNode;
  stat: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const base = "flex flex-col items-center justify-center gap-1.5 flex-1 py-4 transition-colors rounded-xl";
  const color = active ? "text-brand-600" : "text-warm-400 hover:text-warm-700";
  const cls = `${base} ${color}`;

  const inner = (
    <>
      <span className="leading-none">{icon}</span>
      <span className="text-sm font-semibold text-warm-800 leading-none">{stat}</span>
      <span className="text-[10px] text-warm-400 leading-none tracking-wide uppercase">{label}</span>
    </>
  );

  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function Divider() {
  return <div className="w-px bg-warm-100 my-3 flex-shrink-0" />;
}

/* ── Ana component ── */
export default function RecipeActionBar({
  recipeId,
  recipeTitle,
  commentCount,
  favoriteCount,
  avgRating,
  ratingCount,
  followerCount,
  initialFavorited,
  isLoggedIn,
  targetUserId,
  isAdminProfile,
  initialFollowing,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favCount,  setFavCount]  = useState(favoriteCount);
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [following, setFollowing] = useState(initialFollowing);
  const [follCount, setFollCount] = useState(followerCount);
  const router = useRouter();

  // Diğer FavoriteButton ile senkron
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

  // Takip sayısını FollowButton ile senkron tut
  useEffect(() => {
    const myId = isAdminProfile ? "__admin__" : (targetUserId ?? null);
    if (!myId) return;
    function onFollow(e: Event) {
      const { id, following: val } = (e as CustomEvent<{ id: string; following: boolean }>).detail;
      if (id !== myId) return;
      setFollowing(val);
      setFollCount(c => val ? c + 1 : Math.max(0, c - 1));
    }
    window.addEventListener("follow-change", onFollow);
    return () => window.removeEventListener("follow-change", onFollow);
  }, [isAdminProfile, targetUserId]);

  async function toggleFavorite() {
    if (!isLoggedIn) {
      router.push(`/giris?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (saving) return;
    setSaving(true);
    const optimistic = !favorited;
    setFavorited(optimistic);
    setFavCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    try {
      const res  = await fetch(`/api/recipes/${recipeId}/favorites`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const confirmed = data.favorited as boolean;
        setFavorited(confirmed);
        setFavCount(c => confirmed !== optimistic ? (confirmed ? c + 1 : Math.max(0, c - 1)) : c);
        window.dispatchEvent(new CustomEvent("favorite-changed", {
          detail: { recipeId, favorited: confirmed },
        }));
      } else {
        setFavorited(!optimistic);
        setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
      }
    } catch {
      setFavorited(!optimistic);
      setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: recipeTitle, url }); return; } catch { return; }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ratingLabel = ratingCount > 0 ? `${avgRating.toFixed(1)} · ${fmt(ratingCount)}` : "–";

  return (
    <div className="bg-white border-b border-warm-100 px-2">
      <div className="flex items-stretch">

        {/* Yorumlar */}
        <Cell
          icon={<IconComment />}
          stat={fmt(commentCount)}
          label="Yorum"
          href="#yorumlar"
        />

        <Divider />

        {/* Takip */}
        <div className="flex flex-col items-center justify-center flex-1 py-4 gap-1.5">
          <FollowButton
            targetUserId={targetUserId}
            isAdminProfile={isAdminProfile}
            initialFollowing={initialFollowing}
            isLoggedIn={isLoggedIn}
            size="stacked"
          />
          <span className="text-sm font-semibold text-warm-800 leading-none">{fmt(follCount)}</span>
          <span className="text-[10px] text-warm-400 leading-none tracking-wide uppercase">Takipçi</span>
        </div>

        <Divider />

        {/* Puan */}
        <Cell
          icon={<IconStar />}
          stat={ratingLabel}
          label="Puan"
          href="#puan"
        />

        <Divider />

        {/* Deftere Ekle */}
        <Cell
          icon={<IconHeart filled={favorited} />}
          stat={fmt(favCount)}
          label={favorited ? "Defterde" : "Deftere Ekle"}
          onClick={toggleFavorite}
          active={favorited}
        />

        <Divider />

        {/* Paylaş */}
        <Cell
          icon={copied ? <IconCheck /> : <IconShare />}
          stat=""
          label={copied ? "Kopyalandı" : "Paylaş"}
          onClick={handleShare}
          active={copied}
        />

      </div>
    </div>
  );
}
