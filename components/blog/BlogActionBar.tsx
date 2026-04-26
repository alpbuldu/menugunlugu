"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  postId: string;
  postTitle: string;
  commentCount: number;
  favoriteCount: number;
  avgRating: number;
  ratingCount: number;
  followerCount: number;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  authorProfileHref?: string;
  initialUserRating?: number;
  shareCount?: number;
}

/* ── SVG ikonlar ── */
const Ico = {
  comment:  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  follow:   <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  following:<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  star:     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starOn:   <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  heart:    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartOn:  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  share:    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  check:    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function goLogin() {
  window.location.href = `/giris?from=${encodeURIComponent(window.location.pathname)}`;
}

function Cell({
  icon, stat, label, onClick, href, active,
}: {
  icon: React.ReactNode;
  stat: string;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const color = active ? "text-brand-600" : "text-warm-400 hover:text-warm-700";

  const inner = (
    <span className="flex flex-col items-center w-full">
      <span className={`h-8 flex items-center justify-center transition-colors ${color}`}>
        {icon}
      </span>
      <span className="h-5 flex items-center justify-center">
        <span className="text-[12px] font-semibold text-warm-700 tabular-nums leading-none">{stat}</span>
      </span>
      <span className="h-4 flex items-center justify-center">
        <span className={`text-[10px] leading-none ${active ? "text-brand-500" : "text-warm-400"}`}>{label}</span>
      </span>
    </span>
  );

  const base = "flex-1 flex items-center justify-center py-3 hover:bg-warm-50 transition-colors rounded-lg cursor-pointer";
  if (href) return <a href={href} className={base}>{inner}</a>;
  return <button type="button" onClick={onClick} className={base}>{inner}</button>;
}

function Sep() {
  return <div className="w-px bg-warm-100 my-2 flex-shrink-0" />;
}

export default function BlogActionBar({
  postId, postTitle,
  commentCount, favoriteCount, avgRating, ratingCount, followerCount,
  initialFavorited, isLoggedIn, initialFollowing,
  authorProfileHref,
  initialUserRating = 0,
  shareCount: initialShareCount = 0,
}: Props) {
  const [favorited,  setFavorited]  = useState(initialFavorited);
  const [favCount,   setFavCount]   = useState(favoriteCount);
  const [favSaving,  setFavSaving]  = useState(false);
  const [following,  setFollowing]  = useState(initialFollowing);
  const [follCount,  setFollCount]  = useState(followerCount);
  const [rating,     setRating]     = useState({ avg: avgRating, count: ratingCount });
  const [userRating, setUserRating] = useState(initialUserRating);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [copied,     setCopied]     = useState(false);
  const [,           startTransition] = useTransition();
  const router = useRouter();
  const selfDispatch = useRef(false);

  /* BlogRatingStars'tan puan güncellemesi */
  useEffect(() => {
    function onRating(e: Event) {
      const { postId: id, avg, count, userScore } = (e as CustomEvent).detail;
      if (id !== postId) return;
      setRating({ avg, count });
      if (typeof userScore === "number") setUserRating(userScore);
    }
    window.addEventListener("blog-rating-changed", onRating);
    return () => window.removeEventListener("blog-rating-changed", onRating);
  }, [postId]);

  /* Dış follow eventleri */
  useEffect(() => {
    function onFollow(e: Event) {
      if (selfDispatch.current) return;
      const { id, following: val } = (e as CustomEvent<{ id: string; following: boolean }>).detail;
      if (id !== "__admin__") return;
      setFollowing(val);
      setFollCount(c => val ? c + 1 : Math.max(0, c - 1));
    }
    window.addEventListener("follow-change", onFollow);
    return () => window.removeEventListener("follow-change", onFollow);
  }, []);

  /* Dış favorite eventleri */
  useEffect(() => {
    function onFav(e: Event) {
      const { postId: id, favorited: val } = (e as CustomEvent).detail;
      if (id !== postId) return;
      setFavorited(val);
      setFavCount(c => val ? c + 1 : Math.max(0, c - 1));
    }
    window.addEventListener("blog-favorite-changed", onFav);
    return () => window.removeEventListener("blog-favorite-changed", onFav);
  }, [postId]);

  /* Takip et — admin */
  function handleFollow() {
    if (!isLoggedIn) { goLogin(); return; }
    const optimistic = !following;
    setFollowing(optimistic);
    setFollCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    const evDetail = { id: "__admin__", following: optimistic };
    selfDispatch.current = true;
    window.dispatchEvent(new CustomEvent("follow-change", { detail: evDetail }));
    selfDispatch.current = false;
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel("follow-state");
      ch.postMessage(evDetail); ch.close();
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/member/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_admin: true }),
        });
        if (res.ok) {
          const data = await res.json();
          const confirmed = data.following as boolean;
          if (confirmed !== optimistic) {
            setFollowing(confirmed);
            setFollCount(c => confirmed ? c + 1 : Math.max(0, c - 1));
            window.dispatchEvent(new CustomEvent("follow-change", { detail: { id: "__admin__", following: confirmed } }));
          }
          setTimeout(() => router.refresh(), 600);
        } else {
          setFollowing(!optimistic);
          setFollCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
        }
      } catch {
        setFollowing(!optimistic);
        setFollCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
      }
    });
  }

  /* Kaydet (blog favorisi) */
  async function toggleFavorite() {
    if (!isLoggedIn) { goLogin(); return; }
    if (favSaving) return;
    setFavSaving(true);
    const optimistic = !favorited;
    setFavorited(optimistic);
    setFavCount(c => optimistic ? c + 1 : Math.max(0, c - 1));
    try {
      const res  = await fetch(`/api/blog/${postId}/favorites`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const confirmed = data.favorited as boolean;
        if (confirmed !== optimistic) {
          setFavorited(confirmed);
          setFavCount(c => confirmed ? c + 1 : Math.max(0, c - 1));
        }
        window.dispatchEvent(new CustomEvent("blog-favorite-changed", { detail: { postId, favorited: confirmed } }));
      } else {
        setFavorited(!optimistic);
        setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
      }
    } catch {
      setFavorited(!optimistic);
      setFavCount(c => optimistic ? Math.max(0, c - 1) : c + 1);
    } finally {
      setFavSaving(false);
    }
  }

  /* Paylaş */
  async function handleShare() {
    const url = window.location.href;
    setShareCount(c => c + 1);
    fetch(`/api/blog/${postId}/shares`, { method: "POST" }).catch(() => {});
    if (navigator.share) {
      try { await navigator.share({ title: postTitle, url }); return; } catch { return; }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ratingDisplay = rating.count > 0
    ? `${rating.avg.toFixed(1)} · ${fmt(rating.count)}`
    : "–";

  return (
    <div className="bg-white border-b border-warm-100 px-2">
      <div className="flex items-stretch">

        <Cell
          icon={Ico.comment}
          stat={fmt(commentCount)}
          label="Yorum"
          href="#yorumlar"
        />

        <Sep />

        <Cell
          icon={following ? Ico.following : Ico.follow}
          stat={fmt(follCount)}
          label={following ? "Yazar kartını gör" : "Takip Et"}
          onClick={following && authorProfileHref ? undefined : handleFollow}
          href={following && authorProfileHref ? authorProfileHref : undefined}
          active={following}
        />

        <Sep />

        <Cell
          icon={userRating > 0 ? Ico.starOn : Ico.star}
          stat={ratingDisplay}
          label={userRating > 0 ? `${userRating} yıldız` : "Puan"}
          href="#puan"
          active={userRating > 0}
        />

        <Sep />

        <Cell
          icon={favorited ? Ico.heartOn : Ico.heart}
          stat={fmt(favCount)}
          label={favorited ? "Defterini gör" : "Deftere Ekle"}
          onClick={favorited ? undefined : toggleFavorite}
          href={favorited ? "/uye/panel?tab=tarif-defterim&defter=blog" : undefined}
          active={favorited}
        />

        <Sep />

        <Cell
          icon={copied ? Ico.check : Ico.share}
          stat={shareCount > 0 ? fmt(shareCount) : ""}
          label={copied ? "Kopyalandı" : "Paylaş"}
          onClick={handleShare}
          active={copied}
        />

      </div>
    </div>
  );
}
