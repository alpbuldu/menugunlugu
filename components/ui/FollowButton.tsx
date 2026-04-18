"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId?: string;
  isAdminProfile?: boolean;
  initialFollowing: boolean;
  isLoggedIn: boolean;
  /** "icon" = sadece ikon (+ / ✓), "xs" = küçük yazılı, "sm" = varsayılan mini, "md" = profil sayfası için belirgin */
  size?: "icon" | "xs" | "sm" | "md";
}

const CHANNEL = "follow-state";

export default function FollowButton({
  targetUserId,
  isAdminProfile,
  initialFollowing,
  isLoggedIn,
  size = "sm",
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const router   = useRouter();
  const myId     = isAdminProfile ? "__admin__" : (targetUserId ?? null);
  // pending sırasında server prop değişikliğinin üzerine yazmasını engelle
  const pendingRef = useRef(false);

  // Server prop değişince (router.refresh() sonrası) local state'i güncelle
  useEffect(() => {
    if (!pendingRef.current) setFollowing(initialFollowing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFollowing]);

  // Sayfa tekrar focus'a gelince server verisini tazele
  useEffect(() => {
    function onFocus() { router.refresh(); }
    window.addEventListener("visibilitychange", onFocus);
    return () => window.removeEventListener("visibilitychange", onFocus);
  }, [router]);

  // Aynı sekmedeki diğer FollowButton'ları dinle (CustomEvent)
  useEffect(() => {
    if (!myId) return;
    function handler(e: Event) {
      const { id, following: v } = (e as CustomEvent<{ id: string; following: boolean }>).detail;
      if (id === myId) setFollowing(v);
    }
    window.addEventListener("follow-change", handler);
    return () => window.removeEventListener("follow-change", handler);
  }, [myId]);

  // Farklı tab / aynı tarayıcı → BroadcastChannel
  useEffect(() => {
    if (!myId || typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e: MessageEvent<{ id: string; following: boolean }>) => {
      if (e.data.id === myId) setFollowing(e.data.following);
    };
    return () => ch.close();
  }, [myId]);

  function broadcast(newVal: boolean) {
    if (!myId) return;
    // Aynı sekme
    window.dispatchEvent(new CustomEvent("follow-change", { detail: { id: myId, following: newVal } }));
    // Diğer sekmeler
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(CHANNEL);
      ch.postMessage({ id: myId, following: newVal });
      ch.close();
    }
  }

  function handleClick() {
    if (!isLoggedIn) { router.push(`/giris?from=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }

    // Optimistic update hemen
    const optimistic = !following;
    setFollowing(optimistic);
    broadcast(optimistic);

    pendingRef.current = true;
    startTransition(async () => {
      try {
        const body = isAdminProfile ? { is_admin: true } : { following_id: targetUserId };
        const res  = await fetch("/api/member/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          const confirmed: boolean = data.following;
          // Sunucu cevabı optimistic ile farklıysa düzelt
          if (confirmed !== optimistic) {
            setFollowing(confirmed);
            broadcast(confirmed);
          }
          // Refresh'i biraz geciktir — DB yazımına süre tanı
          setTimeout(() => router.refresh(), 600);
        } else {
          // Hata durumunda geri al
          setFollowing(!optimistic);
          broadcast(!optimistic);
        }
      } catch {
        setFollowing(!optimistic);
        broadcast(!optimistic);
      } finally {
        pendingRef.current = false;
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={[
        size === "icon"
          ? "w-7 h-7 rounded-full text-sm font-bold transition-all border flex-shrink-0 flex items-center justify-center"
          : size === "xs"
          ? "px-2.5 sm:px-2 py-1 sm:py-0.5 rounded-lg sm:rounded-md text-xs sm:text-[11px] font-medium transition-all border flex-shrink-0"
          : size === "md"
          ? "px-5 py-2 rounded-xl text-sm font-semibold transition-all border flex-shrink-0"
          : "px-3 py-2 rounded-xl text-sm font-medium transition-all border flex-shrink-0",
        size === "icon"
          ? following
            ? "bg-warm-100 border-warm-200 text-warm-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            : "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600"
          : size === "xs"
          ? following
            ? "bg-warm-100 border-warm-200 text-warm-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            : "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600"
          : size === "md"
          ? following
            ? "bg-warm-100 border-warm-200 text-warm-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            : "bg-brand-600 border-brand-600 text-white hover:bg-brand-700 hover:border-brand-700"
          : following
            ? "bg-warm-100 border-warm-200 text-warm-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            : "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600",
        isPending ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {size === "icon"
        ? (isPending ? "…" : following ? "✓" : (
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          ))
        : (isPending ? "…" : following ? "Takip Ediliyor" : "Takip Et")}
    </button>
  );
}
