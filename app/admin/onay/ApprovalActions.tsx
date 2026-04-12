"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  itemId: string;
  type?: "recipe" | "post";
  categories?: BlogCategory[];
}

export default function ApprovalActions({ itemId, type = "recipe", categories = [] }: Props) {
  const [loading,    setLoading]    = useState<"approve" | "reject" | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const router = useRouter();

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    await fetch("/api/admin/onay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: itemId,
        action,
        type,
        ...(type === "post" && action === "approve" && categoryId ? { category_id: categoryId } : {}),
      }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end w-full">
      {/* Kategori seçimi — sadece post onayında */}
      {type === "post" && categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-warm-200 text-sm text-warm-700 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        >
          <option value="">Kategori seç (isteğe bağlı)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={() => handle("reject")}
        disabled={!!loading}
        className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading === "reject" ? "İşleniyor…" : "🗑 Reddet"}
      </button>
      <button
        onClick={() => handle("approve")}
        disabled={!!loading}
        className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading === "approve" ? "İşleniyor…" : "✅ Onayla"}
      </button>
    </div>
  );
}
