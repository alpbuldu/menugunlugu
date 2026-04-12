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
        "px-5 py-2 rounded-xl text-sm font-semibold transition-all border",
        following
          ? "bg-warm-100 border-warm-300 text-warm-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          : "bg-brand-600 border-brand-600 text-white hover:bg-brand-700",
        isPending ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {isPending ? "..." : following ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
