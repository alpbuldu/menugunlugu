"use client";

import { useState } from "react";
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
  const text = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
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

interface ShoppingModalProps {
  selection: Record<Category, MenuRecipe>;
  onClose: () => void;
}

function ShoppingModal({ selection, onClose }: ShoppingModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100 bg-brand-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-base font-semibold text-warm-900">Alışveriş Listesi</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-800 transition-colors"
            aria-label="Kapat"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-4 space-y-5">
          {SLOTS.map(({ key, label, emoji }) => {
            const recipe = selection[key];
            const items = parseIngredients(recipe.ingredients);
            if (!items.length) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{emoji}</span>
                  <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{label}</h3>
                  <span className="text-xs text-warm-400">— {recipe.title}</span>
                </div>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-warm-100 text-warm-700 text-sm font-medium hover:bg-warm-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
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
      className={`group relative w-full text-left rounded-xl border overflow-hidden transition-all duration-150 ${
        isSelected
          ? "border-brand-400 shadow-md ring-2 ring-brand-200/60"
          : "border-warm-200 hover:border-brand-300 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Image */}
      <div className="relative h-36 bg-warm-100">
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

      {/* Title */}
      <div className="px-3 py-2.5">
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
  const [showShopping, setShowShopping] = useState(false);

  const allFilled = SLOTS.every(({ key }) => !!selection[key]);
  const filledCount = SLOTS.filter(({ key }) => !!selection[key]).length;

  function selectRecipe(recipe: MenuRecipe) {
    setSelection((prev) => ({ ...prev, [activeCategory]: recipe }));
    // Auto-advance to next unfilled slot
    const nextSlot = SLOTS.find(({ key }) => key !== activeCategory && !selection[key]);
    if (nextSlot) setActiveCategory(nextSlot.key);
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

  const currentRecipes = grouped[activeCategory];

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left / Top: Slots ────────────────────────────────── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
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
            <div className="mt-4 px-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-warm-400">{filledCount} / 4 seçildi</span>
                {allFilled && (
                  <span className="text-xs text-brand-600 font-medium">Menü hazır!</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-warm-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-400 transition-all duration-500"
                  style={{ width: `${(filledCount / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            {allFilled && (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowShopping(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100 hover:border-amber-300 transition-colors"
                >
                  <span>🛒</span>
                  Alışveriş Listesi
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <span>📥</span>
                  Menü Kartını İndir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right / Bottom: Recipe Picker ────────────────────── */}
        <div className="flex-1 min-w-0">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {currentRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isSelected={selection[activeCategory]?.id === recipe.id}
                  onSelect={() => selectRecipe(recipe)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shopping list modal */}
      {showShopping && allFilled && (
        <ShoppingModal
          selection={selection as Record<Category, MenuRecipe>}
          onClose={() => setShowShopping(false)}
        />
      )}
    </>
  );
}
