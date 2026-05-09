"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlimRecipe {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  kcal_per_person?: number | null;
}

interface FeedPost {
  id: string;
  user_id: string;
  created_at: string;
  title: string | null;
  soup_title: string | null;
  main_title: string | null;
  side_title: string | null;
  dessert_title: string | null;
  soup_slug: string | null;
  main_slug: string | null;
  side_slug: string | null;
  dessert_slug: string | null;
  soup_image_url: string | null;
  main_image_url: string | null;
  side_image_url: string | null;
  dessert_image_url: string | null;
  category: string | null;
  kcal_total: number;
  author: { username: string; avatar_url: string | null };
}

interface AdminMenu {
  id: string;
  menu_category: string;
  date: string;
  soup: SlimRecipe | null;
  main: SlimRecipe | null;
  side: SlimRecipe | null;
  dessert: SlimRecipe | null;
}

interface AdminProfile {
  username: string;
  avatar_url: string | null;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  "gunluk":      { label: "Günlük Ev Menüsü",      emoji: "🏠" },
  "gunluk-ev":   { label: "Günlük Ev Menüsü",      emoji: "🏠" },
  "ev":          { label: "Ev Yemekleri Menüsü",   emoji: "🍲" },
  "misafir":     { label: "Misafir Menüsü",         emoji: "🥂" },
  "kahvalti":    { label: "Kahvaltı Menüsü",        emoji: "☕" },
  "akdeniz":     { label: "Akdeniz Menüsü",         emoji: "🫒" },
  "et":          { label: "Et Yemekleri Menüsü",    emoji: "🥩" },
  "vejetaryen":  { label: "Vejetaryen Menüsü",      emoji: "🥦" },
  "deniz":       { label: "Deniz Ürünleri Menüsü",  emoji: "🦐" },
  "klasik":      { label: "Klasik Türk Menüsü",     emoji: "🍲" },
  "hafif":       { label: "Hafif Menü",             emoji: "🥗" },
  "pratik":      { label: "Pratik Menü",            emoji: "⚡" },
  "saglikli":    { label: "Sağlıklı Menü",          emoji: "🌿" },
  "ekonomik":    { label: "Ekonomik Menü",          emoji: "💚" },
  "ozel":        { label: "Özel Menü",              emoji: "✨" },
};

function getCatLabel(key: string | null): string {
  if (!key) return "Menü";
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key].label;
  return key.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Menüsü";
}

const CELL_CONFIGS = [
  { key: "soup"    as const, label: "Çorba",           titleKey: "soup_title"    as const, imgKey: "soup_image_url"    as const, slugKey: "soup_slug"    as const },
  { key: "main"    as const, label: "Ana Yemek",       titleKey: "main_title"    as const, imgKey: "main_image_url"    as const, slugKey: "main_slug"    as const },
  { key: "side"    as const, label: "Yardımcı Lezzet", titleKey: "side_title"    as const, imgKey: "side_image_url"    as const, slugKey: "side_slug"    as const },
  { key: "dessert" as const, label: "Tatlı",           titleKey: "dessert_title" as const, imgKey: "dessert_image_url" as const, slugKey: "dessert_slug" as const },
];

// ─── Shared 2×2 Grid ─────────────────────────────────────────────────────────

function MenuGrid({ post }: {
  post: Pick<FeedPost, "soup_title"|"main_title"|"side_title"|"dessert_title"|"soup_slug"|"main_slug"|"side_slug"|"dessert_slug"|"soup_image_url"|"main_image_url"|"side_image_url"|"dessert_image_url">
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-warm-100">
      {CELL_CONFIGS.map(cfg => {
        const title = post[cfg.titleKey];
        const img   = post[cfg.imgKey];
        const slug  = post[cfg.slugKey];
        const inner = (
          <div className="relative bg-warm-50" style={{ aspectRatio: "1" }}>
            {img ? (
              <Image src={img} alt={title ?? cfg.label} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl bg-warm-100">🍽️</div>
            )}
            <div className="absolute top-2 left-2">
              <span className="inline-block bg-black/50 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none">
                {cfg.label}
              </span>
            </div>
            {title && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2 pb-2 pt-6">
                <p className="text-white text-[11px] sm:text-xs font-semibold leading-snug line-clamp-2">{title}</p>
              </div>
            )}
          </div>
        );
        if (slug) return (
          <Link key={cfg.key} href={`/tarifler/${slug}`} className="block hover:opacity-90 transition-opacity">
            {inner}
          </Link>
        );
        return <div key={cfg.key}>{inner}</div>;
      })}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return (
    <img src={url} alt={name} style={{ width: s, height: s }}
      className="rounded-full object-cover flex-shrink-0" />
  );
  return (
    <span style={{ width: s, height: s }}
      className="rounded-full bg-warm-200 text-warm-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {name.charAt(0)}
    </span>
  );
}

// ─── Admin Menu Card ──────────────────────────────────────────────────────────

function AdminMenuCard({ menu, adminProfile }: { menu: AdminMenu; adminProfile: AdminProfile }) {
  const catLabel = getCatLabel(menu.menu_category);
  const kcalTotal = [menu.soup, menu.main, menu.side, menu.dessert]
    .reduce((sum, r) => sum + (r?.kcal_per_person ?? 0), 0);

  return (
    <div className="flex-shrink-0 w-60 sm:w-72 bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-3 py-2.5 border-b border-warm-100 flex items-center gap-2">
        <Avatar url={adminProfile.avatar_url} name={adminProfile.username} size={26} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-warm-400 truncate leading-none mb-0.5">@{adminProfile.username}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-warm-600 truncate leading-tight">
            {catLabel}
          </p>
        </div>
        {kcalTotal > 0 && (
          <span className="text-[9px] sm:text-[10px] text-warm-400 flex-shrink-0 whitespace-nowrap">{kcalTotal} kcal</span>
        )}
      </div>
      <MenuGrid post={{
        soup_title: menu.soup?.title ?? null,
        main_title: menu.main?.title ?? null,
        side_title: menu.side?.title ?? null,
        dessert_title: menu.dessert?.title ?? null,
        soup_slug: menu.soup?.slug ?? null,
        main_slug: menu.main?.slug ?? null,
        side_slug: menu.side?.slug ?? null,
        dessert_slug: menu.dessert?.slug ?? null,
        soup_image_url: menu.soup?.image_url ?? null,
        main_image_url: menu.main?.image_url ?? null,
        side_image_url: menu.side?.image_url ?? null,
        dessert_image_url: menu.dessert?.image_url ?? null,
      }} />
    </div>
  );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────

function FeedCard({ post }: { post: FeedPost }) {
  const catLabel = getCatLabel(post.category);

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-3 py-2.5 border-b border-warm-100 flex items-center gap-2">
        <Avatar url={post.author.avatar_url} name={post.author.username} size={26} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-warm-400 truncate leading-none mb-0.5">@{post.author.username}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-warm-600 truncate leading-tight">
            {catLabel}
          </p>
        </div>
        {post.kcal_total > 0 && (
          <span className="text-[9px] sm:text-[10px] text-warm-400 flex-shrink-0 whitespace-nowrap">{post.kcal_total} kcal</span>
        )}
      </div>
      <MenuGrid post={post} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MenuGunluguClient({
  initialFeed,
  adminMenus,
  adminProfile,
}: {
  initialFeed: FeedPost[];
  adminMenus: AdminMenu[];
  adminProfile?: AdminProfile | null;
}) {
  const [feed, setFeed]               = useState<FeedPost[]>(initialFeed);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(initialFeed.length === 20);
  const [catFilter, setCatFilter]     = useState("all");
  const [feedCatFilter, setFeedCatFilter] = useState("all");
  const scrollRef                     = useRef<HTMLDivElement>(null);

  const ap: AdminProfile = adminProfile ?? { username: "Admin", avatar_url: null };

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 288, behavior: "smooth" });
  }

  async function loadMore() {
    if (loading) return;
    const next = page + 1;
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-gunlugu/feed?page=${next}`);
      const data: FeedPost[] = await res.json();
      setFeed(f => [...f, ...data]);
      setPage(next);
      if (data.length < 20) setHasMore(false);
    } finally { setLoading(false); }
  }

  // Editor category filter
  const presentKeys = [...new Set(adminMenus.map(m => m.menu_category))];
  const catFilters = [
    { key: "all", label: "Tümü" },
    ...presentKeys.map(k => ({ key: k, label: getCatLabel(k) })),
  ];
  const filteredMenus = catFilter === "all"
    ? adminMenus
    : adminMenus.filter(m => m.menu_category === catFilter);

  // Feed category filter
  const feedPresentKeys = [...new Set(feed.map(p => p.category).filter(Boolean) as string[])];
  const feedCatFilters = [
    { key: "all", label: "Tümü" },
    ...feedPresentKeys.map(k => ({ key: k, label: getCatLabel(k) })),
  ];
  const filteredFeed = feedCatFilter === "all"
    ? feed
    : feed.filter(p => p.category === feedCatFilter);

  return (
    <div className="space-y-8">

      {/* ── Editörün Menü Önerileri ── */}
      {adminMenus.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-warm-900">Editörün Menü Önerileri</h2>
              <span className="text-xs text-warm-400 font-normal">— Editörler tarafından hazırlanan menü önerileri için kaydırın.</span>
            </div>
            <div className="flex-1 h-px bg-warm-100" />
          </div>

          {catFilters.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 [&::-webkit-scrollbar]:hidden">
              {catFilters.map(f => (
                <button key={f.key} onClick={() => setCatFilter(f.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    catFilter === f.key
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Slider */}
          <div className="relative group/slider">
            <button
              onClick={() => scrollBy(-1)}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white border border-warm-200 rounded-full shadow-md items-center justify-center text-warm-600 hover:bg-warm-50 hover:text-warm-900 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Önceki"
            >
              ‹
            </button>

            <div ref={scrollRef}
              className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
              {filteredMenus.map(m => <AdminMenuCard key={m.id} menu={m} adminProfile={ap} />)}
              {filteredMenus.length === 0 && (
                <p className="text-sm text-warm-400 py-6">Bu kategoride menü yok</p>
              )}
            </div>

            <button
              onClick={() => scrollBy(1)}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white border border-warm-200 rounded-full shadow-md items-center justify-center text-warm-600 hover:bg-warm-50 hover:text-warm-900 transition-all opacity-0 group-hover/slider:opacity-100"
              aria-label="Sonraki"
            >
              ›
            </button>
          </div>
        </section>
      )}

      {/* ── Menü Günlüğü Akışı ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-warm-900">Menü Günlüğü Akışı</h2>
            <span className="text-xs text-warm-400 font-normal">— Kullanıcılar tarafından paylaşılan menü önerilerini görmek için aşağı kaydırın.</span>
          </div>
          <div className="flex-1 h-px bg-warm-100" />
        </div>

        {feedCatFilters.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 [&::-webkit-scrollbar]:hidden">
            {feedCatFilters.map(f => (
              <button key={f.key} onClick={() => setFeedCatFilter(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  feedCatFilter === f.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {filteredFeed.length === 0 && !loading && (
          <div className="text-center py-16 bg-warm-50 rounded-2xl">
            <p className="text-4xl mb-3">📔</p>
            <p className="text-sm font-semibold text-warm-600 mb-1">
              {feedCatFilter === "all" ? "Henüz paylaşım yok" : "Bu kategoride paylaşım yok"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredFeed.map(p => <FeedCard key={p.id} post={p} />)}
        </div>

        {hasMore && feedCatFilter === "all" && (
          <button onClick={loadMore} disabled={loading}
            className="mt-6 w-full py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-2xl border border-warm-200 transition-colors disabled:opacity-50">
            {loading ? "Yükleniyor…" : "Daha fazla göster"}
          </button>
        )}
      </section>

    </div>
  );
}
