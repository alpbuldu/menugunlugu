"use client";

import { useState, useEffect, useRef } from "react";
import { zipSync } from "fflate";
import Image from "next/image";
import type { Category } from "@/lib/types";
import type { MenuRecipe } from "./page";

const SLOTS: { key: Category; label: string; short: string; emoji: string }[] = [
  { key: "soup",    label: "Çorba",           short: "Çorba",     emoji: "🥣" },
  { key: "main",    label: "Ana Yemek",        short: "Ana Yemek", emoji: "🍽️" },
  { key: "side",    label: "Yardımcı Lezzet",  short: "Yardımcı",  emoji: "🥗" },
  { key: "dessert", label: "Tatlı",            short: "Tatlı",     emoji: "🍮" },
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

        {/* Author overlay — bottom-left inside image */}
        {!isSelected && recipe.author && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-1.5 left-2 right-2 pointer-events-none flex flex-col gap-px">
              <span className="text-[10px] text-white/55 leading-none font-semibold">Yazar</span>
              <span className="text-[10px] text-white/90 truncate leading-none">{recipe.author}</span>
            </div>
          </>
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
  const [perPage, setPerPage] = useState(10);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const topRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const allFilled = SLOTS.every(({ key }) => !!selection[key]);
  const filledCount = SLOTS.filter(({ key }) => !!selection[key]).length;

  // Scroll to top on mobile on every recipe selection
  useEffect(() => {
    if (scrollTick === 0) return;
    if (window.innerWidth < 1024) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollTick]);

  // Detect screen size for per-page count
  useEffect(() => {
    const update = () => setPerPage(window.innerWidth < 640 ? 8 : 10);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset page + search when category changes
  useEffect(() => { setPage(0); setSearchTitle(""); setSearchAuthor(""); }, [activeCategory]);

  function selectRecipe(recipe: MenuRecipe) {
    setSelection((prev) => ({ ...prev, [activeCategory]: recipe }));
    setScrollTick((t) => t + 1);
    // Auto-advance to next unfilled slot
    const nextSlot = SLOTS.find(({ key }) => key !== activeCategory && !selection[key]);
    if (nextSlot) { setActiveCategory(nextSlot.key); setPage(0); }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    const currentIdx = SLOTS.findIndex(({ key }) => key === activeCategory);
    if (dx < 0 && currentIdx < SLOTS.length - 1) { setActiveCategory(SLOTS[currentIdx + 1].key); setPage(0); }
    else if (dx > 0 && currentIdx > 0) { setActiveCategory(SLOTS[currentIdx - 1].key); setPage(0); }
  }

  function clearSlot(category: Category) {
    setSelection((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }

  function generateCaption(sel: Record<Category, MenuRecipe>): string {
    const today = new Date().toLocaleDateString("tr-TR", {
      weekday: "long", day: "numeric", month: "long",
    });
    return [
      `🍽️ ${today} günün menüsü hazır!`,
      `Bugün sofrada: ${sel.soup.title}, ${sel.main.title}, ${sel.side.title} ve ${sel.dessert.title} var.`,
      `Tariflerin detaylarına ve daha fazlasına menugunlugu.com üzerinden ulaşabilir, kendi günlük menünüzü oluşturabilirsiniz.`,
      `Afiyet olsun! 😊\n\n#menugunlugu #günlükmenu #yemektarifleri #türkmutfağı #evyemeği #yemek #tarif`,
    ].join("\n");
  }

  async function handleCard(format: "post" | "story") {
    if (!allFilled || downloading) return;
    const sel = selection as Record<Category, MenuRecipe>;
    const baseParams = new URLSearchParams({
      soup:    sel.soup.id,
      main:    sel.main.id,
      side:    sel.side.id,
      dessert: sel.dessert.id,
      format,
    });

    if (format === "story") {
      window.open(`/api/menu-karti?${baseParams.toString()}`, "_blank");
      return;
    }

    // Post: 5 görsel — kapak + 4 slide
    setDownloading(true);
    try {
      const labels   = ["kapak", "corba", "ana-yemek", "yardimci", "tatli"];
      const coverUrl = `/api/menu-karti?${baseParams.toString()}`;
      const slideUrls = [1, 2, 3, 4].map(i => {
        const p = new URLSearchParams(baseParams);
        p.set("slide", String(i));
        return `/api/menu-karti?${p.toString()}`;
      });
      const allUrls = [coverUrl, ...slideUrls];

      // Tüm görselleri paralel olarak oluştur
      const blobs = await Promise.all(
        allUrls.map(async url => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return res.blob();
          } catch { return null; }
        })
      );

      // ArrayBuffer'lara dönüştür
      const buffers = await Promise.all(
        blobs.map(b => b ? b.arrayBuffer() : Promise.resolve(null))
      );

      // ZIP olarak tek dosyada paketle (PNG zaten sıkıştırılmış → level 0)
      const zipFiles: Record<string, Uint8Array> = {};
      for (let i = 0; i < buffers.length; i++) {
        const buf = buffers[i];
        if (buf) zipFiles[`${labels[i]}.png`] = new Uint8Array(buf);
      }
      // Caption önerisi — metin dosyası olarak ekle
      const caption = generateCaption(sel);
      zipFiles["caption.txt"] = new TextEncoder().encode(caption);

      const zipped  = zipSync(zipFiles, { level: 0 });
      const zipBlob = new Blob([zipped], { type: "application/zip" });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "gunun-menusu.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
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
  const norm = (s: string) => s.toLocaleLowerCase("tr");
  const filtered = currentRecipes.filter((r) => {
    const titleOk  = !searchTitle  || norm(r.title).includes(norm(searchTitle));
    const authorOk = !searchAuthor || norm(r.author).includes(norm(searchAuthor));
    return titleOk && authorOk;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const pagedRecipes = filtered.slice(page * perPage, (page + 1) * perPage);

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
                <span>Tarif Kartını Oluştur</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCard("post")}
                  disabled={!allFilled || downloading}
                  title={allFilled ? "5 görsel tek ZIP olarak indir (kapak + 4 tarif)" : "4 yemek seç"}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                    allFilled && !downloading
                      ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                      : "bg-warm-200 text-warm-400 cursor-not-allowed"
                  }`}
                >
                  {downloading ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" strokeOpacity={0.3}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                      <span className="whitespace-nowrap">İndiriliyor…</span>
                    </>
                  ) : (
                    <>
                      <span>📸</span>
                      <span className="whitespace-nowrap">Paylaş · Post</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCard("story")}
                  disabled={!allFilled}
                  title={allFilled ? "Story kartı indir (1080×1920)" : "4 yemek seç"}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                    allFilled
                      ? "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
                      : "bg-warm-200 text-warm-400 cursor-not-allowed"
                  }`}
                >
                  <span>📱</span>
                  <span className="whitespace-nowrap">Paylaş · Story</span>
                </button>
              </div>

              <p className={`text-center text-[11px] pt-0.5 transition-colors ${
                allFilled
                  ? "text-brand-600 font-medium"
                  : "text-warm-400"
              }`}>
                {downloading
                  ? "⏳ 5 görsel hazırlanıyor, ZIP indiriliyor…"
                  : allFilled
                  ? "🎉 Menü hazır — indir ve paylaş!"
                  : `${4 - filledCount} yemek daha seç → kartı oluştur`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right / Bottom: Recipe Picker ────────────────────── */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Category tabs — mobile: segmented control / desktop: pill buttons */}

          {/* Mobile segmented control */}
          <div className="flex lg:hidden bg-warm-100 rounded-2xl p-1 mb-4 gap-0.5">
            {SLOTS.map((slot) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => setActiveCategory(slot.key)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-200 ${
                  activeCategory === slot.key
                    ? "bg-white shadow-sm"
                    : "hover:bg-warm-50"
                }`}
              >
                <span className="text-xl leading-none">{slot.emoji}</span>
                <span className={`text-[10px] font-medium leading-tight ${
                  activeCategory === slot.key ? "text-brand-700" : "text-warm-500"
                }`}>{slot.short}</span>
                {selection[slot.key] && (
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                    activeCategory === slot.key ? "bg-brand-400" : "bg-brand-300"
                  }`} />
                )}
              </button>
            ))}
          </div>

          {/* Desktop pill buttons */}
          <div className="hidden lg:flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
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

          {/* Search inputs */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => { setSearchTitle(e.target.value); setPage(0); }}
                placeholder="Tarif ara..."
                className="w-full text-sm pl-3 pr-7 py-2 rounded-xl border border-warm-200 bg-white focus:outline-none focus:border-brand-400 text-warm-800 placeholder:text-warm-400"
              />
              {searchTitle && (
                <button
                  type="button"
                  onClick={() => { setSearchTitle(""); setPage(0); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                  aria-label="Aramayı temizle"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchAuthor}
                onChange={(e) => { setSearchAuthor(e.target.value); setPage(0); }}
                placeholder="Yazar ara..."
                className="w-full text-sm pl-3 pr-7 py-2 rounded-xl border border-warm-200 bg-white focus:outline-none focus:border-brand-400 text-warm-800 placeholder:text-warm-400"
              />
              {searchAuthor && (
                <button
                  type="button"
                  onClick={() => { setSearchAuthor(""); setPage(0); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                  aria-label="Aramayı temizle"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Active category info + inline pagination */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-warm-500 text-sm flex-shrink-0">
                {filtered.length !== currentRecipes.length
                  ? `${filtered.length} / ${currentRecipes.length} tarif`
                  : `${currentRecipes.length} tarif`}
              </span>
              {selection[activeCategory] && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-medium truncate">
                  Seçili: {selection[activeCategory]!.title}
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-warm-200 text-warm-500 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  ←
                </button>
                <span className="text-xs text-warm-400 min-w-[36px] text-center">{page + 1}/{totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-warm-200 text-warm-500 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* Recipe grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-warm-100">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-warm-500">
                {currentRecipes.length === 0
                  ? "Bu kategoride onaylı tarif bulunamadı."
                  : "Arama kriterlerine uyan tarif bulunamadı."}
              </p>
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
                    <span className="ml-1.5 text-warm-300">({filtered.length} tarif)</span>
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
