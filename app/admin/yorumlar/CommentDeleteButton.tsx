"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  commentId: string;
  type: "recipe" | "blog";
}

export default function CommentDeleteButton({ commentId, type }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    const res = await fetch("/api/admin/yorumlar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId, type }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {loading ? "Siliniyor…" : "Sil"}
    </button>
  );
}
