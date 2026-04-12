"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId?: string;
  isAdmin?: boolean;
}

export default function UnfollowButton({ targetUserId, isAdmin }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUnfollow() {
    setLoading(true);
    await fetch("/api/member/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isAdmin ? { is_admin: true } : { following_id: targetUserId }),
    });
    setLoading(false);
    router.refresh();
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1 flex-shrink-0">
        <button onClick={handleUnfollow} disabled={loading}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
          {loading ? "…" : "Evet, çık"}
        </button>
        <span className="text-warm-300">·</span>
        <button onClick={() => setConfirm(false)}
          className="text-xs text-warm-400 hover:underline">
          İptal
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="text-xs text-warm-300 hover:text-red-500 hover:underline flex-shrink-0 transition-colors">
      Takipten çık
    </button>
  );
}
