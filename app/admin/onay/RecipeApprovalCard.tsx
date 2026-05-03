"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};
const CATEGORIES = [
  { value: "soup",    label: "🍲 Çorba" },
  { value: "main",    label: "🥘 Ana Yemek" },
  { value: "side",    label: "🥗 Yardımcı Lezzet" },
  { value: "dessert", label: "🍮 Tatlı" },
];

// HTML <li> veya <p> listesini düz satırlara çevirir
function htmlToLines(html: string): string {
  return html
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .join("\n");
}

// Düz satırları <ul>/<ol> HTML'e çevirir
function linesToHtml(text: string, tag: "ul" | "ol"): string {
  const lines = text.split("\n").filter(l => l.trim());
  return `<${tag}>${lines.map(l => `<li>${l.trim()}</li>`).join("")}</${tag}>`;
}

export interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    slug: string;
    category: string;
    image_url: string | null;
    description: string | null;
    ingredients: string;
    instructions: string;
    servings: number | null;
    created_at: string;
    updated_at: string | null;
    profiles: { username: string; avatar_url: string | null } | null;
  };
}

function isRevision(created_at: string, updated_at: string | null) {
  if (!updated_at) return false;
  return new Date(updated_at).getTime() - new Date(created_at).getTime() > 30_000;
}

export default function RecipeApprovalCard({ recipe: initial }: RecipeCardProps) {
  const router = useRouter();
  const editRef = useRef<HTMLDivElement>(null);
  const [recipe, setRecipe]   = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [acting,  setActing]  = useState<"approve" | "reject" | null>(null);
  const [saveErr, setSaveErr] = useState("");

  // Edit state — plain text for easy editing
  const [title,         setTitle]         = useState(recipe.title);
  const [description,   setDescription]   = useState(recipe.description ?? "");
  const [category,      setCategory]      = useState(recipe.category);
  const [servings,      setServings]      = useState(String(recipe.servings ?? 4));
  const [imagePosition, setImagePosition] = useState<"top"|"center"|"bottom">("center");
  const [ingredients,   setIngredients]   = useState(() => htmlToLines(recipe.ingredients));
  const [steps,         setSteps]         = useState(() => htmlToLines(recipe.instructions));

  function startEdit() {
    setTitle(recipe.title);
    setDescription(recipe.description ?? "");
    setCategory(recipe.category);
    setServings(String(recipe.servings ?? 4));
    setIngredients(htmlToLines(recipe.ingredients));
    setSteps(htmlToLines(recipe.instructions));
    setEditing(true);
    setSaveErr("");
    setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function saveEdits() {
    if (!title.trim()) { setSaveErr("Başlık boş olamaz."); return; }
    setSaving(true); setSaveErr("");
    const fields = {
      title:          title.trim(),
      description:    description.trim() || null,
      category,
      servings:       parseInt(servings) || 4,
      image_position: imagePosition,
      ingredients:    linesToHtml(ingredients, "ul"),
      instructions:   linesToHtml(steps, "ol"),
    };
    const res = await fetch("/api/admin/onay", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, type: "recipe", fields }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveErr(data.error ?? "Kaydedilemedi."); return; }
    setRecipe(r => ({
      ...r, ...fields,
      ingredients:  fields.ingredients,
      instructions: fields.instructions,
    }));
    setEditing(false);
  }

  async function handleAction(action: "approve" | "reject") {
    setActing(action);
    await fetch("/api/admin/onay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id, action, type: "recipe" }),
    });
    setActing(null);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
      {/* Üst: görsel + özet bilgi */}
      <div className="flex gap-4 p-5">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
          {recipe.image_url ? (
            <Image src={recipe.image_url} alt={recipe.title} width={96} height={96}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-bold text-warm-900 text-lg leading-snug">{recipe.title}</h2>
                {isRevision(recipe.created_at, recipe.updated_at) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    ✏️ Düzenleme
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                  {CATEGORY_LABELS[recipe.category] ?? recipe.category}
                </span>
                {recipe.servings && (
                  <span className="text-xs text-warm-400">👤 {recipe.servings} kişilik</span>
                )}
                <span className="text-xs text-warm-400">
                  {new Date(recipe.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
              {recipe.description && (
                <p className="text-sm text-warm-500 mt-2">{recipe.description}</p>
              )}
            </div>
            {recipe.profiles && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
                  {recipe.profiles.avatar_url ? (
                    <Image src={recipe.profiles.avatar_url} alt={recipe.profiles.username}
                      width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">👤</span>
                  )}
                </div>
                <span className="text-sm text-warm-600 font-medium">{recipe.profiles.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* İçerik — görüntüleme veya düzenleme */}
      {editing ? (
        <div ref={editRef} className="border-t border-warm-100 p-5 space-y-4">
          {/* Başlık */}
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Başlık</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
            />
          </div>
          {/* Kategori + Porsiyon */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Kategori</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Porsiyon</label>
              <select
                value={servings}
                onChange={e => setServings(e.target.value)}
                className="px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
              >
                {[1,2,3,4,6,8,10,12].map(n => <option key={n} value={n}>{n} kişilik</option>)}
              </select>
            </div>
          </div>
          {/* Görsel Konumu */}
          {recipe.image_url && (
            <div>
              <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Görsel Konumu</label>
              <div className="flex gap-2">
                {(["top", "center", "bottom"] as const).map(pos => {
                  const labels = { top: "⬆️ Yukarı", center: "⬛ Orta", bottom: "⬇️ Aşağı" };
                  return (
                    <button key={pos} type="button" onClick={() => setImagePosition(pos)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        imagePosition === pos
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "bg-white border-warm-200 text-warm-600 hover:border-brand-300"
                      }`}
                    >{labels[pos]}</button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Tanıtım */}
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">Kısa Tanıtım</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="opsiyonel"
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
            />
          </div>
          {/* Malzemeler */}
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">
              Malzemeler <span className="text-warm-400 font-normal normal-case">(her satır = bir madde)</span>
            </label>
            <textarea
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 font-mono leading-relaxed focus:outline-none focus:border-brand-400 resize-y"
            />
          </div>
          {/* Yapılış */}
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wide block mb-1">
              Yapılış <span className="text-warm-400 font-normal normal-case">(her satır = bir adım)</span>
            </label>
            <textarea
              value={steps}
              onChange={e => setSteps(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 font-mono leading-relaxed focus:outline-none focus:border-brand-400 resize-y"
            />
          </div>
          {saveErr && <p className="text-sm text-red-500">{saveErr}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-warm-200 text-warm-600 text-sm hover:bg-warm-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={saveEdits}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "💾 Kaydet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-warm-100 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-100">
          <div className="p-5">
            <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Malzemeler</h3>
            <div
              className="recipe-content text-sm text-warm-700"
              dangerouslySetInnerHTML={{ __html: recipe.ingredients }}
            />
          </div>
          <div className="p-5">
            <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Yapılışı</h3>
            <div
              className="recipe-content text-sm text-warm-700"
              dangerouslySetInnerHTML={{ __html: recipe.instructions }}
            />
          </div>
        </div>
      )}

      {/* Aksiyon barı */}
      <div className="border-t border-warm-100 px-5 py-3 bg-warm-50 flex items-center justify-between gap-3">
        <button
          onClick={startEdit}
          disabled={!!acting || editing}
          className="px-4 py-2 rounded-xl border border-warm-300 text-warm-600 hover:bg-warm-100 text-sm font-medium transition-colors disabled:opacity-40"
        >
          ✏️ Düzenle
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction("reject")}
            disabled={!!acting}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {acting === "reject" ? "İşleniyor…" : "🗑 Reddet"}
          </button>
          <button
            onClick={() => handleAction("approve")}
            disabled={!!acting}
            className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {acting === "approve" ? "İşleniyor…" : "✅ Onayla"}
          </button>
        </div>
      </div>
    </div>
  );
}
