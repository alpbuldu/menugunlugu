"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import type { AdminMenu } from "@/lib/supabase/admin-queries";

interface Props {
  recipes: Recipe[];
  menu?:   AdminMenu; // undefined = create, defined = edit
}

const COURSE_FIELDS = [
  { field: "soup_id",    label: "Çorba",     category: "soup"    },
  { field: "main_id",    label: "Ana Yemek", category: "main"    },
  { field: "side_id",    label: "Yardımcı Lezzetler", category: "side"    },
  { field: "dessert_id", label: "Tatlı",     category: "dessert" },
] as const;

type CourseField = (typeof COURSE_FIELDS)[number]["field"];

export default function MenuForm({ recipes, menu }: Props) {
  const router = useRouter();
  const isEdit = !!menu;

  const [date,      setDate]     = useState(menu?.date    ?? new Date().toLocaleDateString("en-CA"));
  const [status,    setStatus]   = useState<"draft" | "published">(menu?.status ?? "draft");
  const [courseIds, setCourseIds] = useState<Record<CourseField, string>>({
    soup_id:    menu?.soup_id    ?? "",
    main_id:    menu?.main_id    ?? "",
    side_id:    menu?.side_id    ?? "",
    dessert_id: menu?.dessert_id ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function byCategory(cat: string) {
    return recipes.filter((r) => r.category === cat);
  }

  function handleCourse(field: CourseField, value: string) {
    setCourseIds((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate all 4 courses are selected
    const missing = COURSE_FIELDS.filter((c) => !courseIds[c.field]);
    if (missing.length > 0) {
      setError(`Lütfen şunları seçin: ${missing.map((c) => c.label).join(", ")}`);
      return;
    }

    setSaving(true);
    setError("");

    const payload = { date, status, ...courseIds };

    const res = await fetch(
      isEdit ? `/api/menu/${menu!.id}` : "/api/menu",
      {
        method:  isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (res.ok) {
      router.push("/admin/menus");
      router.refresh();
    } else {
      setError(data.error ?? "Kaydedilemedi.");
      setSaving(false);
    }
  }

  const selectCls =
    "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm transition-shadow";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Tarih <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={selectCls}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Durum
        </label>
        <div className="flex gap-3">
          {(["draft", "published"] as const).map((s) => (
            <label
              key={s}
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors",
                status === s
                  ? s === "published"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-warm-100 border-warm-300 text-warm-700"
                  : "bg-white border-warm-200 text-warm-500 hover:border-warm-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="sr-only"
              />
              {s === "published" ? "✅ Yayınla" : "📝 Taslak"}
            </label>
          ))}
        </div>
        <p className="text-xs text-warm-400 mt-1.5">
          Yalnızca "Yayınla" seçilirse sitede görünür.
        </p>
      </div>

      {/* Course selectors */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-warm-800 border-b border-warm-100 pb-2">
          Yemekler
        </h3>

        {COURSE_FIELDS.map(({ field, label, category }) => {
          const options = byCategory(category);
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                {label} <span className="text-red-400">*</span>
                {options.length === 0 && (
                  <span className="ml-2 text-xs text-orange-500 font-normal">
                    (Bu kategoride tarif yok — önce tarif ekleyin)
                  </span>
                )}
              </label>
              <select
                value={courseIds[field]}
                onChange={(e) => handleCourse(field, e.target.value)}
                required
                disabled={options.length === 0}
                className={`${selectCls} ${options.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="">{label} seçin…</option>
                {options.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          ⚠️ {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Menüyü Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl font-medium text-sm hover:bg-warm-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
