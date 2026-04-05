"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { Category } from "@/lib/types";

const links = [
  { href: "/",        label: "Ana Sayfa" },
  { href: "/menu",    label: "Günün Menüsü" },
  { href: "/archive", label: "Dünün Menüsü" },
  { href: "/recipes", label: "Tarifler" },
  { href: "/blog",    label: "Blog" },
];

const CATEGORY_LABELS: Record<Category, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Eşlikçi",
  dessert: "Tatlı",
};

interface SearchRecipe {
  id:       string;
  title:    string;
  slug:     string;
  category: Category;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ─── Shared search logic hook ─────────────────────────────────── */
function useSearch() {
  const [query,    setQuery]    = useState("");
  const [recipes,  setRecipes]  = useState<SearchRecipe[]>([]);
  const [results,  setResults]  = useState<SearchRecipe[]>([]);
  const [fetched,  setFetched]  = useState(false);
  const [fetching, setFetching] = useState(false);

  const ensureRecipes = useCallback(async () => {
    if (fetched || fetching) return;
    setFetching(true);
    try {
      const res  = await fetch("/api/recipes");
      const json = await res.json();
      setRecipes((json.recipes ?? []) as SearchRecipe[]);
    } catch {
      // silently fail
    } finally {
      setFetched(true);
      setFetching(false);
    }
  }, [fetched, fetching]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    setResults(recipes.filter(r => r.title.toLowerCase().includes(q)).slice(0, 5));
  }, [query, recipes]);

  function clearSearch() {
    setQuery("");
    setResults([]);
  }

  return { query, setQuery, results, fetching, ensureRecipes, clearSearch };
}

/* ─── Desktop search pill + dropdown ───────────────────────────── */
function DesktopSearch() {
  const { query, setQuery, results, fetching, ensureRecipes, clearSearch } = useSearch();
  const containerRef  = useRef<HTMLDivElement>(null);
  const showDropdown  = query.trim().length > 0;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearSearch();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-warm-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={ensureRecipes}
          placeholder="Tarif ara…"
          autoComplete="off"
          className="w-[170px] pl-8 pr-3 py-1 rounded-full text-sm bg-warm-100 border border-warm-200 text-warm-700 placeholder:text-warm-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 transition-colors"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 w-full min-w-[240px] bg-white border border-warm-200 rounded-2xl shadow-lg overflow-hidden z-50">
          {fetching ? (
            <div className="px-4 py-3 text-sm text-warm-400">Yükleniyor…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-warm-400">Sonuç bulunamadı</div>
          ) : (
            <ul>
              {results.map((recipe, i) => (
                <li key={recipe.id}>
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    onClick={clearSearch}
                    className={clsx(
                      "flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-warm-50 transition-colors",
                      i !== results.length - 1 && "border-b border-warm-100"
                    )}
                  >
                    <span className="text-sm font-medium text-warm-800 truncate">{recipe.title}</span>
                    <span className="text-xs text-warm-400 flex-shrink-0">{CATEGORY_LABELS[recipe.category]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile search panel + dropdown ───────────────────────────── */
function MobileSearchPanel({ onClose }: { onClose: () => void }) {
  const { query, setQuery, results, fetching, ensureRecipes, clearSearch } = useSearch();
  const showDropdown = query.trim().length > 0;

  function handleSelect() {
    clearSearch();
    onClose();
  }

  return (
    <div className="md:hidden absolute top-full left-0 right-0 bg-white border border-brand-200 border-t-0 rounded-b-2xl shadow-lg z-50">
      <div className="px-4 py-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={ensureRecipes}
            placeholder="Tarif ara…"
            autoFocus
            autoComplete="off"
            className="w-full pl-9 pr-4 py-2.5 rounded-full text-base bg-warm-50 border border-warm-200 text-warm-700 placeholder:text-warm-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 transition-colors"
          />
        </div>
      </div>

      {showDropdown && (
        <div className="border-t border-warm-100">
          {fetching ? (
            <div className="px-5 py-4 text-sm text-warm-400">Yükleniyor…</div>
          ) : results.length === 0 ? (
            <div className="px-5 py-4 text-sm text-warm-400">Sonuç bulunamadı</div>
          ) : (
            <ul>
              {results.map((recipe, i) => (
                <li key={recipe.id}>
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    onClick={handleSelect}
                    className={clsx(
                      "flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-warm-50 active:bg-warm-100 transition-colors",
                      i !== results.length - 1 && "border-b border-warm-100"
                    )}
                  >
                    <span className="text-sm font-medium text-warm-800">{recipe.title}</span>
                    <span className="text-xs text-warm-400 flex-shrink-0">{CATEGORY_LABELS[recipe.category]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Navigation ───────────────────────────────────────────── */
export default function Navigation() {
  const pathname   = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [open,       setOpen]       = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  /* Close everything on route change */
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /* Lock body scroll while nav drawer is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Scroll → close both panels immediately */
  useEffect(() => {
    if (!open && !searchOpen) return;
    function handleScroll() {
      setOpen(false);
      setSearchOpen(false);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open, searchOpen]);

  /* Click/touch outside → close mobile panels */
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;
      const target = "touches" in e ? e.touches[0]?.target : e.target;
      if (target && !wrapperRef.current.contains(target as Node)) {
        setOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown",  handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown",  handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  function toggleNav() {
    setOpen(v => !v);
    setSearchOpen(false);
  }
  function toggleSearch() {
    setSearchOpen(v => !v);
    setOpen(false);
  }

  return (
    <>
      {/* ── Desktop: nav links + search ──────────────────────── */}
      <div className="hidden md:flex items-center gap-5">
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-brand-100 text-brand-800"
                  : "text-warm-700 hover:bg-warm-100 hover:text-warm-900"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <DesktopSearch />
      </div>

      {/* ── Mobile: buttons + dropdowns (single ref wrapper) ─── */}
      <div ref={wrapperRef} className="md:hidden">
        {/* Button row */}
        <div className="flex items-center gap-2 pr-1">
          {/* Search toggle */}
          <button
            onClick={toggleSearch}
            aria-label={searchOpen ? "Aramayı kapat" : "Ara"}
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-colors",
              searchOpen ? "bg-brand-100 text-brand-700" : "text-warm-600 hover:bg-warm-100"
            )}
          >
            <SearchIcon />
          </button>

          {/* Hamburger */}
          <button
            onClick={toggleNav}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            className={clsx(
              "flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-xl transition-colors",
              open ? "bg-brand-100" : "hover:bg-warm-100"
            )}
          >
            <span className={clsx("block w-5 h-0.5 bg-warm-700 rounded transition-all duration-200", open && "translate-y-2 rotate-45")} />
            <span className={clsx("block w-5 h-0.5 bg-warm-700 rounded transition-all duration-200", open && "opacity-0")} />
            <span className={clsx("block w-5 h-0.5 bg-warm-700 rounded transition-all duration-200", open && "-translate-y-2 -rotate-45")} />
          </button>
        </div>

        {/* Nav dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 bg-white border border-brand-200 border-t-0 rounded-b-2xl shadow-lg z-50 overflow-hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center px-5 py-3.5 text-sm font-medium border-b border-warm-100 last:border-0 transition-colors",
                  pathname === link.href
                    ? "text-brand-700 bg-brand-50"
                    : "text-warm-700 hover:bg-warm-50 hover:text-warm-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Search panel */}
        {searchOpen && (
          <MobileSearchPanel onClose={() => setSearchOpen(false)} />
        )}
      </div>
    </>
  );
}
