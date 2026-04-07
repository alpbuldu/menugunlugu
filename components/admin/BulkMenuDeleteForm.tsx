"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminMenu } from "@/lib/supabase/admin-queries";

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
function formatDateTR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS_TR[parseInt(m) - 1]} ${y}`;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Yayında", cls: "bg-green-100 text-green-700" },
  draft:     { label: "Taslak",  cls: "bg-warm-100 text-warm-500"  },
};

interface Props { menus: AdminMenu[] }

export default function BulkMenuDeleteForm({ menus }: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("all");
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  const filtered = useMemo(() => {
    return menus.filter((m) => {
      const matchStatus = status === "all" || m.status === status;
      const matchSearch = !search.trim() ||
        m.date.includes(search) ||
        m.soup.title.toLowerCase().includes(search.toLowerCase()) ||
        m.main.title.toLowerCase().includes(search.toLowerCase()) ||
        m.side.title.toLowerCase().includes(search.toLowerCase()) ||
        m.dessert.title.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [menus, search, status]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));

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
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m.id));
        return next;
      });
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    const ok = window.confirm(
      `${selected.size} menü kalıcı olarak silinecek. Emin misiniz?`
    );
    if (!ok) return;

    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/menus/bulk", {
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
      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tarih veya yemek adında ara…"
          className="flex-1 min-w-[200px] px-4 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-warm-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
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
            {filtered.length} menü gösteriliyor
            {selected.size > 0 && (
              <span className="ml-2 font-semibold text-brand-700">
                · {selected.size} seçili
              </span>
            )}
          </span>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
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
          {deleting
            ? "Siliniyor…"
            : selected.size > 0
              ? `${selected.size} Menüyü Sil`
              : "Sil"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-warm-400 py-8 text-center">Eşleşen menü bulunamadı.</p>
      ) : (
        <div className="border border-warm-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-200">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-warm-600">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-warm-600 hidden md:table-cell">Yemekler</th>
                <th className="text-left px-4 py-3 font-medium text-warm-600 hidden sm:table-cell">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-white">
              {filtered.map((menu) => {
                const st = STATUS_LABELS[menu.status] ?? STATUS_LABELS.draft;
                const isSelected = selected.has(menu.id);
                return (
                  <tr
                    key={menu.id}
                    onClick={() => toggleOne(menu.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-red-50" : "hover:bg-warm-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(menu.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-warm-800 whitespace-nowrap">
                      {formatDateTR(menu.date)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-warm-600">
                        <span>🍲 {menu.soup.title}</span>
                        <span>🍽️ {menu.main.title}</span>
                        <span>🥗 {menu.side.title}</span>
                        <span>🍮 {menu.dessert.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
