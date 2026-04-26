"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FollowButton from "@/components/ui/FollowButton";

interface Props {
  recipeId: string;
  recipeTitle: string;
  // Sunucudan gelen başlangıç sayıları
  commentCount: number;
  favoriteCount: number;
  avgRating: number;
  ratingCount: number;
  // Kullanıcı durumu
  initialFavorited: boolean;
  isLoggedIn: boolean;
  // Takip
  targetUserId?: string;
  isAdminProfile: boolean;
  initialFollowing: boolean;
}

function ActionItem({
  icon,
  label,
  sub,
  onClick,
  href,
  active,
  activeColor = "text-brand-600",
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string | number;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  activeColor?: string;
}) {
  const cls = [
    "flex flex-col items-center gap-1 flex-1 py-3 px-1 transition-colors cursor-pointer select-none",
    "hover:bg-warm-50 rounded-xl",
    active ? activeColor : "text-warm-500",
  ].join(" ");

  const content = (
    <>
      <span className="text-xl leading-none">{icon}</span>
      {sub !== undefined && (
        <span className="text-[11px] font-semibold text-warm-700 leading-none">{sub}</span>
      )}
      <span className="text-[10px] leading-none text-warm-400">{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

function Sep() {
  return <span className="w-px self-stretch bg-warm-100 my-2 flex-shrink-0" />;
}

export default function RecipeActionBar({
  recipeId,
  recipeTitle,
  commentCount,
  favoriteCount,
  avgRating,
  ratingCount,
  initialFavorited,
  isLoggedIn,
  targetUserId,
  isAdminProfile,
  initialFollowing,
}: Props) {
  const [favorited, setFavorited]   = useState(initialFavorited);
  const [favCount, setFavCount]     = useState(favoriteCount);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const router = useRouter();

  // Sync from other FavoriteButton instances on the page
  useEffect(() => {
    function onSync(e: Event) {
      const { recipeId: id, favorited: val } = (e as CustomEvent).detail;
      if (id === recipeId) {
        setFavorited(val);
        setFavCount(c => val ? c + 1 : Math.max(0, c - 1));
      }
    }
    window.addEventListener("favorite-changed", onSync);
    return () => window.removeEventListener("favorite-changed", onSync);
  }, [recipeId]);

  async function toggleFavorite() {
    if (!isLoggedIn) {
      router.push(`/giris?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`/api/recipes/${recipeId}/favorites`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const newVal = data.favorited as boolean;
        setFavorited(newVal);
        setFavCount(c => newVal ? c + 1 : Math.max(0, c - 1));
        window.dispatchEvent(new CustomEvent("favorite-changed", {
          detail: { recipeId, favorited: newVal },
        }));
      }
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

  const ratingLabel = ratingCount > 0
    ? `${avgRating.toFixed(1)} · ${ratingCount} oy`
    : "Oy yok";

  return (
    <div className="border-b border-warm-100 bg-white">
      <div className="flex items-stretch divide-x divide-warm-100">

        {/* Yorumlar */}
        <ActionItem
          icon="💬"
          sub={commentCount}
          label="Yorum"
          href="#yorumlar"
        />

        <Sep />

        {/* Takip Et — FollowButton stacked içinde */}
        <div className="flex flex-col items-center justify-center flex-1 py-3 px-1">
          <FollowButton
            targetUserId={targetUserId}
            isAdminProfile={isAdminProfile}
            initialFollowing={initialFollowing}
            isLoggedIn={isLoggedIn}
            size="stacked"
          />
        </div>

        <Sep />

        {/* Puan */}
        <ActionItem
          icon="⭐"
          sub={ratingLabel}
          label="Puanla"
          href="#puan"
        />

        <Sep />

        {/* Deftere Ekle */}
        <ActionItem
          icon={favorited ? "❤️" : "🤍"}
          sub={favCount > 0 ? favCount : undefined}
          label={favorited ? "Defterde" : "Deftere Ekle"}
          onClick={saving ? undefined : toggleFavorite}
          active={favorited}
          activeColor="text-red-500"
        />

        <Sep />

        {/* Paylaş */}
        <ActionItem
          icon={copied ? "✅" : "↗️"}
          label={copied ? "Kopyalandı" : "Paylaş"}
          onClick={handleShare}
        />

      </div>
    </div>
  );
}
