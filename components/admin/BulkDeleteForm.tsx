"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const CATEGORY_COLORS: Record<string, string> = {
  soup:    "bg-blue-100 text-blue-700",
  main:    "bg-brand-100 text-brand-700",
  side:    "bg-green-100 text-green-700",
  dessert: "bg-pink-100 text-pink-700",
};

interface Props {
  recipes: Recipe[];
}

export default function BulkDeleteForm({ recipes }: Props) {
  const router = useRouter();

  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("all");
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState("");

  // Filtreli liste
  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat    = category === "all" || r.category === category;
      const matchSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [recipes, search, category]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    const confirm = window.confirm(
      `${selected.size} tarif kalıcı olarak silinecek. Emin misiniz?`
    );
    if (!confirm) return;

    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/recipes/bulk", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Hata oluştu"); return; }
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Sunucu hatası");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filtre araçları */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tarif adında ara…"
          className="flex-1 min-w-[180px] px-4 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-warm-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400"
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="soup">Çorba</option>
          <option value="main">Ana Yemek</option>
          <option value="side">Yardımcı Lezzet</option>
          <option value="dessert">Tatlı</option>
        </select>
      </div>

      {/* Aksiyon bar */}
      <div className="flex items-center justify-between gap-4 py-3 px-4 bg-warm-50 rounded-xl border border-warm-100">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAllFiltered}
            className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
          />
          <span className="text-sm text-warm-600">
            {filtered.length} tarif gösteriliyor
            {selected.size > 0 && (
              <span className="ml-2 font-semibold text-brand-700">
                · {selected.size} seçili
              </span>
            )}
          </span>
          {selected.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs text-warm-400 hover:text-warm-700 underline transition-colors"
            >
              Seçimi temizle
            </button>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={selected.size === 0 || deleting}
          className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {deleting ? "Siliniyor…" : `${selected.size > 0 ? selected.size + " Tarifi " : ""}Sil`}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Tarif listesi */}
      {filtered.length === 0 ? (
        <p className="text-sm text-warm-400 py-6 text-center">Eşleşen tarif bulunamadı.</p>
      ) : (
        <div className="border border-warm-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-warm-600">Tarif Adı</th>
                <th className="text-left px-4 py-3 font-medium text-warm-600 hidden sm:table-cell">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-white">
              {filtered.map((recipe) => (
                <tr
                  key={recipe.id}
                  onClick={() => toggleOne(recipe.id)}
                  className={`cursor-pointer transition-colors ${
                    selected.has(recipe.id) ? "bg-red-50" : "hover:bg-warm-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(recipe.id)}
                      onChange={() => toggleOne(recipe.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-warm-800">
                    {recipe.title}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[recipe.category]}`}>
                      {CATEGORY_LABELS[recipe.category]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
