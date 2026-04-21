"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import type { Recipe, Category } from "@/lib/types";

/* ── Types ────────────────────────────────────────────────────── */

interface SponsoredAd { image_url: string; link_url: string; title: string | null; }
type SliderItem = { kind: "recipe"; recipe: Recipe } | { kind: "ad"; ad: SponsoredAd };

/* ── Helpers ──────────────────────────────────────────────────── */

function fillRecipes(arr: Recipe[], min: number): Recipe[] {
  if (!arr.length) return [];
  const out = [...arr];
  while (out.length < min) out.push(...arr);
  return out;
}

/**
 * Her 2 tariften sonra 1 reklam ekler: [r, r, ad, r, r, ad, ...]
 * Reklam yoksa sadece tarifleri döndürür.
 */
function buildBaseStream(recipes: Recipe[], ad?: SponsoredAd): SliderItem[] {
  const result: SliderItem[] = [];
  for (let i = 0; i < recipes.length; i++) {
    result.push({ kind: "recipe", recipe: recipes[i] });
    if (ad && (i + 1) % 2 === 0) {
      result.push({ kind: "ad", ad });
    }
  }
  return result;
}

function fillStream(base: SliderItem[], min: number): SliderItem[] {
  if (!base.length) return [];
  const out = [...base];
  while (out.length < min) out.push(...base);
  return out;
}

function atStream(arr: SliderItem[], i: number): SliderItem {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

/* ── Arrow button ─────────────────────────────────────────────── */

function Arrow({
  dir, onClick, overlay, imgHalf,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  overlay: boolean;
  imgHalf: number;
}) {
  const label = dir === "prev" ? "Önceki" : "Sonraki";
  const glyph = dir === "prev" ? "‹" : "›";

  if (overlay) {
    const side = dir === "prev" ? "left-3" : "right-3";
    return (
      <button
        onClick={onClick}
        aria-label={label}
        style={{ top: imgHalf }}
        className={
          `absolute ${side} -translate-y-1/2 z-20 ` +
          "w-9 h-9 flex items-center justify-center rounded-full " +
          "bg-white/70 backdrop-blur-sm text-warm-700 text-2xl leading-none " +
          "hover:bg-white/90 transition-all duration-150 shadow-md"
        }
      >
        {glyph}
      </button>
    );
  }

  const side = dir === "prev" ? "-left-6" : "-right-6";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={
        `absolute ${side} top-1/2 -translate-y-1/2 z-10 ` +
        "w-11 h-11 flex items-center justify-center rounded-full " +
        "bg-white/90 border border-warm-200 shadow-md text-2xl text-warm-500 " +
        "hover:scale-110 hover:shadow-lg hover:text-brand-600 hover:border-brand-300 " +
        "transition-all duration-150"
      }
    >
      {glyph}
    </button>
  );
}

/* ── Sponsored card ───────────────────────────────────────────── */

function SponsoredCard({ ad }: { ad: SponsoredAd }) {
  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="relative block w-full h-full rounded-2xl shadow-sm border border-warm-200 overflow-hidden group"
    >
      <img
        src={ad.image_url}
        alt={ad.title ?? "Sponsorlu"}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 absolute inset-0"
      />
      <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/40 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
        Sponsorlu
      </span>
      {ad.title && (
        <div className="absolute bottom-0 right-0 bg-gradient-to-l from-black/55 to-transparent pl-8 pr-3 py-2.5 z-10">
          <p className="text-xs font-medium text-white/90 text-right leading-snug tracking-wide">
            {ad.title}
          </p>
        </div>
      )}
    </a>
  );
}

/* ── Slider ───────────────────────────────────────────────────── */

interface AuthorInfo { name: string; avatar: string; username: string; }

export default function RecipeSlider({
  recipes,
  adminAuthor,
  profileMap = {},
  compact = false,
  isLoggedIn = false,
  followMap = {},
  followsAdmin = false,
  sponsoredAd,
}: {
  recipes: Recipe[];
  adminAuthor: AuthorInfo;
  profileMap?: Record<string, AuthorInfo>;
  compact?: boolean;
  isLoggedIn?: boolean;
  followMap?: Record<string, boolean>;
  followsAdmin?: boolean;
  sponsoredAd?: SponsoredAd;
}) {
  const [perPage, setPerPage] = useState(3);
  const [pageIdx, setPageIdx] = useState(0);
  const [shift, setShift] = useState(-100);
  const [anim, setAnim] = useState(false);
  const [hovered, setHovered] = useState(false);
  const busy = useRef(false);
  const touchX = useRef<number | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => {
      const next = window.innerWidth < 640 ? 1 : 3;
      setPerPage((prev) => {
        if (prev !== next) setPageIdx(0);
        return next;
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (hovered) return;
    const id = setInterval(() => {
      if (!busy.current) go("next");
    }, 10000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, pageIdx]);

  /* ── Stream oluştur ─────────────────────────────────────────── */
  // Mobil: [r, r, ad, r, r, ad, ...] interleaved
  // Masaüstü: sadece tarifler — reklam render sırasında ortaya eklenir
  const isMobile = perPage === 1;
  const filledRecipes = fillRecipes(recipes, 6);
  const baseStream = (isMobile && sponsoredAd)
    ? buildBaseStream(filledRecipes, sponsoredAd)
    : filledRecipes.map((r) => ({ kind: "recipe" as const, recipe: r }));
  const stream = fillStream(baseStream, perPage * 3);

  const totalPages = Math.ceil(stream.length / perPage);

  function getPage(idx: number): SliderItem[] {
    return Array.from({ length: perPage }, (_, i) =>
      atStream(stream, idx * perPage + i)
    );
  }

  const prevIdx = (pageIdx - 1 + totalPages) % totalPages;
  const nextIdx = (pageIdx + 1) % totalPages;

  function go(dir: "next" | "prev") {
    if (busy.current) return;
    busy.current = true;
    setAnim(true);
    setShift(dir === "next" ? -200 : 0);
    setTimeout(() => {
      setAnim(false);
      setPageIdx(dir === "next" ? nextIdx : prevIdx);
      setShift(-100);
      busy.current = false;
    }, 550);
  }

  function manualGo(dir: "next" | "prev") {
    setHovered(true);
    go(dir);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setHovered(false), 10000);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) go(dx > 0 ? "next" : "prev");
    touchX.current = null;
  }

  if (!stream.length) return null;

  const panels = [getPage(prevIdx), getPage(pageIdx), getPage(nextIdx)];
  const panelGrid = isMobile ? "grid-cols-1" : "grid-cols-3";
  const useOverlay = compact || isMobile;
  const imgClass = compact ? (isMobile ? "h-44" : "h-32") : "h-48";
  const imgHalf  = compact ? (isMobile ? 88 : 64) : 96;

  return (
    <div
      className={`relative ${compact || isMobile ? "mx-0" : "mx-8"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl sm:rounded-none">
        <div
          className="flex"
          style={{
            transform: `translateX(${shift}%)`,
            transition: anim ? "transform 0.55s ease-in-out" : "none",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {panels.map((panel, pi) => (
            <div key={pi} className={`shrink-0 w-full grid ${panelGrid} gap-4`}>
              {panel.map((item, ri) => {

                /* ── Masaüstü: orta slota (index 1) sabit reklam ── */
                if (sponsoredAd && !isMobile && ri === 1) {
                  return (
                    <div key={`sponsored-${pi}`} className="h-full">
                      <SponsoredCard ad={sponsoredAd} />
                    </div>
                  );
                }

                /* ── Mobil stream: reklam öğesi ─────────────────── */
                if (item.kind === "ad") {
                  return (
                    <div key={`ad-${pi}-${ri}`} className="h-72">
                      <SponsoredCard ad={item.ad} />
                    </div>
                  );
                }

                /* ── Tarif kartı ────────────────────────────────── */
                const recipe = item.recipe;
                const a = recipe.submitted_by
                  ? (profileMap[recipe.submitted_by] ?? adminAuthor)
                  : adminAuthor;
                const authorIsAdmin = !recipe.submitted_by;
                const authorUserId  = recipe.submitted_by ?? undefined;
                const initFollowing = authorIsAdmin
                  ? followsAdmin
                  : (followMap[recipe.submitted_by!] ?? false);

                return (
                  <div
                    key={`${pi}-${ri}-${recipe.id}`}
                    className="flex flex-col bg-white rounded-2xl shadow-sm border border-warm-100 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
                  >
                    <Link href={`/recipes/${recipe.slug}`} className="flex flex-col flex-1">
                      <div className={`relative ${imgClass} bg-warm-200 shrink-0`}>
                        {recipe.image_url ? (
                          <Image
                            src={recipe.image_url}
                            alt={recipe.title}
                            fill
                            sizes="(max-width: 640px) 80vw, 300px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-5xl text-warm-300">
                            🍳
                          </div>
                        )}
                      </div>
                      <div className={compact ? "px-4 pt-3 pb-2" : "px-5 pt-5 pb-3"}>
                        <Badge category={recipe.category as Category} />
                        <h3 className={`font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors line-clamp-2 ${compact ? "text-sm" : ""}`}>
                          {recipe.title}
                        </h3>
                      </div>
                    </Link>

                    <div className={`flex items-center gap-2 ${compact ? "px-4" : "px-5"} pb-3 pt-2 border-t border-warm-100`}>
                      <Link
                        href={`/uye/${a.username}`}
                        className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity group/author"
                      >
                        {a.avatar ? (
                          <img src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {a.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-warm-300 leading-none mb-0.5">Yazar</span>
                          <span className="text-xs font-medium text-warm-500 group-hover/author:text-brand-600 transition-colors truncate">
                            {a.name}
                          </span>
                        </div>
                      </Link>
                      <FollowButton
                        targetUserId={authorUserId}
                        isAdminProfile={authorIsAdmin}
                        initialFollowing={initFollowing}
                        isLoggedIn={isLoggedIn}
                        size="xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Arrow dir="prev" onClick={() => manualGo("prev")} overlay={useOverlay} imgHalf={imgHalf} />
      <Arrow dir="next" onClick={() => manualGo("next")} overlay={useOverlay} imgHalf={imgHalf} />
    </div>
  );
}
