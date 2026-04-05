"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogCategory } from "@/lib/types";

interface Props {
  categories: BlogCategory[];
}

export default function BlogCategoryForm({ categories }: Props) {
  const router  = useRouter();
  const [name,    setName]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Hata oluştu"); return; }
      setName("");
      router.refresh();
    } catch {
      setError("Sunucu hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`"${catName}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/blog/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Silme işlemi başarısız"); return; }
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kategori adı"
          className="flex-1 px-4 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-5 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="text-sm text-warm-400">Henüz kategori yok.</p>
      ) : (
        <ul className="divide-y divide-warm-100 border border-warm-100 rounded-xl overflow-hidden">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-warm-50 transition-colors">
              <div>
                <span className="text-sm font-medium text-warm-800">{cat.name}</span>
                <span className="ml-2 text-xs text-warm-400">/{cat.slug}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={deleting === cat.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting === cat.id ? "Siliniyor…" : "Sil"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
