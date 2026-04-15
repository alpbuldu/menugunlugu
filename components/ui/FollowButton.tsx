"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId?: string;   // normal üye için
  isAdminProfile?: boolean; // admin profili için
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export default function FollowButton({ targetUserId, isAdminProfile, initialFollowing, isLoggedIn }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/giris");
      return;
    }
    startTransition(async () => {
      const body = isAdminProfile
        ? { is_admin: true }
        : { following_id: targetUserId };

      const res = await fetch("/api/member/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={[
        "px-3 py-1 rounded-lg text-xs font-medium transition-all border flex-shrink-0",
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
