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

export default function ApprovalActions({ itemId, type = "recipe", categories: initialCategories = [] }: Props) {
  const [loading,      setLoading]      = useState<"approve" | "reject" | null>(null);
  const [categoryId,   setCategoryId]   = useState("");
  const [categories,   setCategories]   = useState<BlogCategory[]>(initialCategories);
  const [showNew,      setShowNew]      = useState(false);
  const [newCatName,   setNewCatName]   = useState("");
  const [creatingCat,  setCreatingCat]  = useState(false);
  const [catError,     setCatError]     = useState("");
  const router = useRouter();

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true); setCatError("");
    const res  = await fetch("/api/admin/blog-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    const data = await res.json();
    setCreatingCat(false);
    if (!res.ok) { setCatError(data.error ?? "Oluşturulamadı."); return; }
    const newCat: BlogCategory = data.category;
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name, "tr")));
    setCategoryId(newCat.id);
    setNewCatName("");
    setShowNew(false);
  }

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
    <div className="flex flex-col gap-3 w-full">
      {/* Kategori seçimi — sadece post onayında */}
      {type === "post" && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setShowNew(false); }}
            className="px-3 py-1.5 rounded-xl border border-warm-200 text-sm text-warm-700 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
          >
            <option value="">Kategori seç (isteğe bağlı)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => { setShowNew((v) => !v); setCategoryId(""); setCatError(""); }}
            className="px-3 py-1.5 rounded-xl border border-dashed border-brand-300 text-brand-600 text-xs font-medium hover:bg-brand-50 transition-colors"
          >
            + Yeni kategori
          </button>

          {showNew && (
            <div className="flex items-center gap-2 w-full mt-1">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                placeholder="Kategori adı…"
                className="flex-1 px-3 py-1.5 rounded-xl border border-warm-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCat || !newCatName.trim()}
                className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {creatingCat ? "…" : "Oluştur"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setNewCatName(""); setCatError(""); }}
                className="px-3 py-1.5 rounded-xl border border-warm-200 text-warm-500 text-xs hover:bg-warm-50 transition-colors"
              >
                İptal
              </button>
            </div>
          )}
          {catError && <p className="text-xs text-red-500 w-full">{catError}</p>}
          {categoryId && (
            <p className="text-xs text-green-600 w-full">
              ✓ Seçili: {categories.find(c => c.id === categoryId)?.name}
            </p>
          )}
        </div>
      )}

      {/* Onay butonları */}
      <div className="flex items-center justify-end gap-3">
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
    </div>
  );
}
