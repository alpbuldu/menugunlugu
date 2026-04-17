"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Category } from "@/lib/types";
import type { MenuRecipe } from "./page";

const SLOTS: { key: Category; label: string; emoji: string }[] = [
  { key: "soup",    label: "Çorba",           emoji: "🥣" },
  { key: "main",    label: "Ana Yemek",        emoji: "🍽️" },
  { key: "side",    label: "Yardımcı Lezzet",  emoji: "🥗" },
  { key: "dessert", label: "Tatlı",            emoji: "🍮" },
];

type Selection = Partial<Record<Category, MenuRecipe>>;

function parseIngredients(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !l.endsWith(":"));
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}


interface SlotCardProps {
  slot: { key: Category; label: string; emoji: string };
  recipe: MenuRecipe | undefined;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
}

function SlotCard({ slot, recipe, isActive, onClick, onClear }: SlotCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 transition-all duration-150 overflow-hidden group ${
        isActive
          ? "border-brand-400 shadow-md ring-2 ring-brand-200/60"
          : recipe
          ? "border-warm-200 hover:border-brand-300 shadow-sm"
          : "border-dashed border-warm-300 hover:border-brand-300"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
          {recipe?.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl text-warm-300">
              {slot.emoji}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-0.5">
            {slot.emoji} {slot.label}
          </p>
          {recipe ? (
            <p className="text-sm font-semibold text-warm-800 truncate">{recipe.title}</p>
          ) : (
            <p className="text-sm text-warm-400 italic">Seçilmedi</p>
          )}
        </div>

        {/* Clear / chevron */}
        {recipe ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-warm-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
            aria-label={`${slot.label} seçimini kaldır`}
          >
            <CloseIcon />
          </button>
        ) : (
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-brand-500" : "text-warm-300"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <div className="h-0.5 bg-brand-400 w-full" />
      )}
    </button>
  );
}

interface RecipeCardProps {
  recipe: MenuRecipe;
  isSelected: boolean;
  onSelect: () => void;
}

function RecipeCard({ recipe, isSelected, onSelect }: RecipeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full text-left rounded-xl border overflow-hidden transition-all duration-150 flex flex-col ${
        isSelected
          ? "border-brand-400 shadow-md ring-2 ring-brand-200/60"
          : "border-warm-200 hover:border-brand-300 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Image — fixed height so all cards align */}
      <div className="relative h-32 sm:h-36 bg-warm-100 flex-shrink-0">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className={`object-cover transition-transform duration-300 ${!isSelected ? "group-hover:scale-105" : ""}`}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-warm-300">
            🍳
          </div>
        )}

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-brand-600/60 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center shadow-lg">
              <CheckIcon />
            </div>
          </div>
        )}
      </div>

      {/* Title — fixed height, 2 lines always */}
      <div className="px-3 py-2.5 h-[52px] flex items-center">
        <p
          className={`text-sm font-medium line-clamp-2 leading-snug transition-colors ${
            isSelected ? "text-brand-700" : "text-warm-800 group-hover:text-brand-700"
          }`}
        >
          {recipe.title}
        </p>
      </div>
    </button>
  );
}

interface MenuBuilderProps {
  grouped: Record<Category, MenuRecipe[]>;
}

export default function MenuBuilder({ grouped }: MenuBuilderProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("soup");
  const [selection, setSelection] = useState<Selection>({});
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const topRef = useRef<HTMLDivElement>(null);

  const allFilled = SLOTS.every(({ key }) => !!selection[key]);
  const filledCount = SLOTS.filter(({ key }) => !!selection[key]).length;

  // Scroll to top on mobile when all slots are filled
  useEffect(() => {
    if (allFilled && window.innerWidth < 1024) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [allFilled]);

  // Detect screen size for per-page count
  useEffect(() => {
    const update = () => setPerPage(window.innerWidth < 640 ? 12 : 15);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset page when category changes
  useEffect(() => setPage(0), [activeCategory]);

  function selectRecipe(recipe: MenuRecipe) {
    setSelection((prev) => ({ ...prev, [activeCategory]: recipe }));
    // Auto-advance to next unfilled slot
    const nextSlot = SLOTS.find(({ key }) => key !== activeCategory && !selection[key]);
    if (nextSlot) { setActiveCategory(nextSlot.key); setPage(0); }
  }

  function clearSlot(category: Category) {
    setSelection((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  function handleDownload() {
    if (!allFilled) return;
    const sel = selection as Record<Category, MenuRecipe>;
    const params = new URLSearchParams({
      soup:    sel.soup.title,
      main:    sel.main.title,
      side:    sel.side.title,
      dessert: sel.dessert.title,
    });
    window.open(`/api/menu-karti?${params.toString()}`, "_blank");
  }

  function handlePdf() {
    if (!allFilled) return;
    const sel = selection as Record<Category, MenuRecipe>;
    const params = new URLSearchParams({
      soup:    sel.soup.id,
      main:    sel.main.id,
      side:    sel.side.id,
      dessert: sel.dessert.id,
    });
    window.open(`/api/menu-pdf-download?${params.toString()}`, "_blank");
  }

  const currentRecipes = grouped[activeCategory];
  const totalPages = Math.ceil(currentRecipes.length / perPage);
  const pagedRecipes = currentRecipes.slice(page * perPage, (page + 1) * perPage);

  return (
    <>
      <div ref={topRef} className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        {/* ── Left / Top: Slots ────────────────────────────────── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col">
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4 flex flex-col flex-1">
            <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3 px-1">
              Seçimleriniz
            </h2>

            <div className="space-y-2">
              {SLOTS.map((slot) => (
                <SlotCard
                  key={slot.key}
                  slot={slot}
                  recipe={selection[slot.key]}
                  isActive={activeCategory === slot.key}
                  onClick={() => setActiveCategory(slot.key)}
                  onClear={() => clearSlot(slot.key)}
                />
              ))}
            </div>

            {/* Progress */}
            <div className="mt-auto pt-4 px-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-warm-400">{filledCount} / 4 seçildi</span>
                {allFilled
                  ? <span className="text-xs text-brand-600 font-medium">Menü hazır!</span>
                  : <span className="text-xs text-warm-400">{4 - filledCount} yemek kaldı</span>
                }
              </div>
              <div className="h-1.5 rounded-full bg-warm-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-400 transition-all duration-500"
                  style={{ width: `${(filledCount / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Action buttons — always visible, disabled until all 4 selected */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handlePdf}
                disabled={!allFilled}
                title={allFilled ? "Günün menüsünü PDF olarak indir" : "4 yemek seçerek günün menüsünü oluştur"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  allFilled
                    ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300 cursor-pointer"
                    : "bg-warm-50 border-warm-200 text-warm-400 cursor-not-allowed"
                }`}
              >
                <span>📄</span>
                <span>Günün Menüsünü Oluştur</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!allFilled}
                title={allFilled ? "Menü kartını görsel olarak indir" : "4 yemek seçerek menü kartını oluştur"}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm ${
                  allFilled
                    ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                    : "bg-warm-200 text-warm-400 cursor-not-allowed"
                }`}
              >
                <span>📥</span>
                <span>Menü Kartını İndir</span>
              </button>

              {!allFilled && (
                <p className="text-center text-[11px] text-warm-400 pt-0.5">
                  4 yemek seç → kartı oluştur
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right / Bottom: Recipe Picker ────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {SLOTS.map((slot) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => setActiveCategory(slot.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                  activeCategory === slot.key
                    ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                    : selection[slot.key]
                    ? "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
                    : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                <span className="text-sm">{slot.emoji}</span>
                {slot.label}
                {selection[slot.key] && activeCategory !== slot.key && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Active category info */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-warm-500 text-sm">
              {currentRecipes.length} tarif
            </span>
            {selection[activeCategory] && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-medium">
                Seçili: {selection[activeCategory]!.title}
              </span>
            )}
          </div>

          {/* Recipe grid */}
          {currentRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-warm-100">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-warm-500">Bu kategoride onaylı tarif bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {pagedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isSelected={selection[activeCategory]?.id === recipe.id}
                    onSelect={() => selectRecipe(recipe)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-warm-200 text-warm-600 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Önceki
                  </button>
                  <span className="text-xs text-warm-400">
                    {page + 1} / {totalPages}
                    <span className="ml-1.5 text-warm-300">({currentRecipes.length} tarif)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-warm-200 text-warm-600 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Sonraki →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </>
  );
}
