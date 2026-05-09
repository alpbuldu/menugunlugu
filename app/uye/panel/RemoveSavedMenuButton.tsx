"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveSavedMenuButton({ feedPostId }: { feedPostId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setLoading(true);
    await fetch(`/api/menu-gunlugu/save?post_id=${feedPostId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Kaydı kaldır"
      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-50 text-warm-400 hover:text-red-500 shadow-sm transition-colors disabled:opacity-50 text-xs"
    >
      {loading ? "…" : "✕"}
    </button>
  );
}
