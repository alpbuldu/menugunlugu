"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId?: string;
  isAdminProfile?: boolean;
  initialFollowing: boolean;
  isLoggedIn: boolean;
  /** "sm" = varsayılan mini, "md" = profil sayfası için biraz daha belirgin */
  size?: "sm" | "md";
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
    if (!isLoggedIn) { router.push("/giris"); return; }

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
        size === "md"
          ? "px-5 py-2 rounded-xl text-sm font-medium transition-all border flex-shrink-0"
          : "px-3 py-1 rounded-lg text-xs font-medium transition-all border flex-shrink-0",
        following
          ? "bg-warm-100 border-warm-200 text-warm-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
          : "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600",
        isPending ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {isPending ? "…" : following ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
