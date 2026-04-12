"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/member/recipes/${recipeId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1 flex-shrink-0">
        <button onClick={handleDelete} disabled={loading}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
          {loading ? "..." : "Evet, sil"}
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
      Sil
    </button>
  );
}
