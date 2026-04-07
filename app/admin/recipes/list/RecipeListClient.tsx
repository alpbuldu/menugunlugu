"use client";

import { useState, useCallback } from "react";
import type { Recipe } from "@/lib/types";

const CATEGORY_ORDER = ["soup", "main", "side", "dessert"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const CATEGORY_COLORS: Record<string, string> = {
  soup:    "bg-blue-100 text-blue-700 border-blue-200",
  main:    "bg-brand-100 text-brand-700 border-brand-200",
  side:    "bg-green-100 text-green-700 border-green-200",
  dessert: "bg-pink-100 text-pink-700 border-pink-200",
};

const CATEGORY_HEADER: Record<string, string> = {
  soup:    "bg-blue-50 border-blue-200",
  main:    "bg-brand-50 border-brand-200",
  side:    "bg-green-50 border-green-200",
  dessert: "bg-pink-50 border-pink-200",
};

export default function RecipeListClient({ recipes }: { recipes: Recipe[] }) {
  const [search,  setSearch]  = useState("");
  const [copied,  setCopied]  = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<string | null>(null);

  const filtered = recipes.filter((r) =>
    search === "" || r.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: filtered.filter((r) => r.category === cat)
                   .sort((a, b) => a.title.localeCompare(b.title, "tr")),
  })).filter((g) => g.items.length > 0);

  const handleCopy = useCallback((title: string) => {
    navigator.clipboard.writeText(title).then(() => {
      setCopied(title);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const handleCopyAll = useCallback((cat: string, items: Recipe[]) => {
    const text = items.map((r) => r.title).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(cat);
      setTimeout(() => setCopiedAll(null), 1800);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Arama + özet */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tarif ara…"
          className="flex-1 px-4 py-2.5 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <span className="text-sm text-warm-400 shrink-0">
          {filtered.length} / {recipes.length} tarif
        </span>
      </div>

      {/* Kategoriler */}
      {grouped.map(({ cat, label, items }) => (
        <div key={cat} className={`border rounded-2xl overflow-hidden ${CATEGORY_HEADER[cat]}`}>
          {/* Kategori başlığı */}
          <div className={`flex items-center justify-between px-5 py-3 border-b ${CATEGORY_HEADER[cat]}`}>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[cat]}`}>
                {label}
              </span>
              <span className="text-sm text-warm-500">{items.length} tarif</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyAll(cat, items)}
              className="text-xs text-warm-400 hover:text-warm-700 transition-colors px-3 py-1 rounded-lg hover:bg-white/60"
            >
              {copiedAll === cat ? "✓ Kopyalandı" : "Tümünü kopyala"}
            </button>
          </div>

          {/* Tarif satırları */}
          <div className="bg-white divide-y divide-warm-100">
            {items.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleCopy(r.title)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-left hover:bg-warm-50 transition-colors group"
              >
                <span className="text-warm-800 font-medium">{r.title}</span>
                <span className="text-xs text-warm-300 group-hover:text-brand-500 transition-colors shrink-0 ml-4">
                  {copied === r.title ? "✓ kopyalandı" : "kopyala"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-warm-400">"{search}" için sonuç bulunamadı.</p>
      )}
    </div>
  );
}
