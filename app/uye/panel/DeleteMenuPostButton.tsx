"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteMenuPostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Bu menüyü akıştan silmek istediğinden emin misin?")) return;
    setLoading(true);
    await fetch(`/api/menu-gunlugu/delete-post?post_id=${postId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Menüyü sil"
      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-50 text-warm-400 hover:text-red-500 shadow-sm transition-colors disabled:opacity-50 text-xs"
    >
      {loading ? "…" : "✕"}
    </button>
  );
}
