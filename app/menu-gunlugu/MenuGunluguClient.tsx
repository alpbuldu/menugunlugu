"use client";

import { useState } from "react";
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
  likes_count: number;
  saves_count: number;
  comments_count: number;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

const MENU_CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  "gunluk":     { label: "Günlük Ev Menüleri",   emoji: "🏠" },
  "ev":         { label: "Ev Yemekleri Menüsü",  emoji: "🍲" },
  "misafir":    { label: "Misafir Menüsü",        emoji: "🥂" },
  "kahvalti":   { label: "Kahvaltı Menüsü",       emoji: "☕" },
  "akdeniz":    { label: "Akdeniz Menüsü",        emoji: "🫒" },
  "et":         { label: "Et Yemekleri Menüsü",   emoji: "🥩" },
  "vejetaryen": { label: "Vejetaryen Menüsü",     emoji: "🥦" },
  "deniz":      { label: "Deniz Ürünleri Menüsü", emoji: "🦐" },
  "klasik":     { label: "Klasik Türk Menüsü",    emoji: "🍲" },
  "hafif":      { label: "Hafif Menü",            emoji: "🥗" },
  "pratik":     { label: "Pratik Menü",           emoji: "⚡" },
};

const CELL_CONFIGS = [
  { key: "soup"    as const, label: "Çorba",           titleKey: "soup_title"    as const, imgKey: "soup_image_url"    as const, slugKey: "soup_slug"    as const },
  { key: "main"    as const, label: "Ana Yemek",       titleKey: "main_title"    as const, imgKey: "main_image_url"    as const, slugKey: "main_slug"    as const },
  { key: "side"    as const, label: "Yardımcı Lezzet", titleKey: "side_title"    as const, imgKey: "side_image_url"    as const, slugKey: "side_slug"    as const },
  { key: "dessert" as const, label: "Tatlı",           titleKey: "dessert_title" as const, imgKey: "dessert_image_url" as const, slugKey: "dessert_slug" as const },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return <img src={url} alt={name} style={{ width: s, height: s }} className="rounded-full object-cover flex-shrink-0" />;
  return (
    <span style={{ width: s, height: s }}
      className="rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase">
      {name.charAt(0)}
    </span>
  );
}

// ─── Feed Card (display-only) ─────────────────────────────────────────────────

function FeedCard({ post }: { post: FeedPost }) {
  const catInfo = MENU_CATEGORY_LABELS[post.category ?? ""] ?? null;

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar url={post.author.avatar_url} name={post.author.username} size={30} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-warm-700 truncate">@{post.author.username}</p>
            {post.title && (
              <p className="text-sm font-extrabold text-warm-900 truncate">{post.title}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
          {post.category && (
            <span className="text-[10px] font-semibold bg-brand-600 text-white px-2 py-0.5 rounded-full">
              {catInfo?.label ?? post.category}
            </span>
          )}
          {post.kcal_total > 0 && (
            <span className="text-[10px] text-warm-400 font-medium">{post.kcal_total} kcal</span>
          )}
        </div>
      </div>

      {/* 2×2 image grid */}
      <div className="grid grid-cols-2 gap-px bg-warm-100">
        {CELL_CONFIGS.map(cfg => {
          const title = post[cfg.titleKey];
          const img   = post[cfg.imgKey];
          const slug  = post[cfg.slugKey];
          const inner = (
            <div className="relative aspect-square bg-warm-50">
              {img ? (
                <Image src={img} alt={title ?? cfg.label} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl bg-warm-100">🍽️</div>
              )}
              <div className="absolute top-0 left-0 bg-brand-600 px-1.5 py-0.5">
                <p className="text-[9px] text-white font-semibold">{cfg.label}</p>
              </div>
              {title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-4">
                  <p className="text-white text-[10px] font-semibold leading-snug line-clamp-2">{title}</p>
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
    </div>
  );
}

// ─── Admin Menu Card (horizontal scroll) ──────────────────────────────────────

function AdminMenuCard({ menu }: { menu: AdminMenu }) {
  const catInfo = MENU_CATEGORY_LABELS[menu.menu_category] ?? { label: menu.menu_category, emoji: "🍽️" };
  const cells = [
    { r: menu.soup,    label: "Çorba" },
    { r: menu.main,    label: "Ana Yemek" },
    { r: menu.side,    label: "Yardımcı Lezzet" },
    { r: menu.dessert, label: "Tatlı" },
  ].filter(c => c.r);

  const kcalTotal = [menu.soup, menu.main, menu.side, menu.dessert]
    .reduce((sum, r) => sum + (r?.kcal_per_person ?? 0), 0);

  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      {/* Category badge */}
      <div className="bg-brand-600 px-3 py-2 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{catInfo.emoji}</span>
          <span className="text-xs font-bold text-white">{catInfo.label}</span>
        </div>
        {kcalTotal > 0 && (
          <span className="text-[10px] font-semibold text-brand-100">{kcalTotal} kcal</span>
        )}
      </div>
      {/* Grid — 2 cols if 4 items */}
      <div className={`grid ${cells.length === 4 ? "grid-cols-2" : "grid-cols-1"} gap-px bg-warm-100`}>
        {cells.map(({ r, label }) => r && (
          <Link key={r.id} href={`/tarifler/${r.slug}`} className="block relative aspect-square bg-warm-50 hover:opacity-90 transition-opacity">
            {r.image_url ? (
              <Image src={r.image_url} alt={r.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl bg-warm-100">🍽️</div>
            )}
            <div className="absolute top-0 left-0 bg-brand-600 px-1.5 py-0.5">
              <p className="text-[8px] text-white font-semibold">{label}</p>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-3">
              <p className="text-white text-[9px] font-semibold leading-snug line-clamp-2">{r.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MenuGunluguClient({
  initialFeed,
  adminMenus,
}: {
  initialFeed: FeedPost[];
  adminMenus: AdminMenu[];
  adminProfile?: { username: string; avatar_url: string | null } | null;
}) {
  const [feed, setFeed]           = useState<FeedPost[]>(initialFeed);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [hasMore, setHasMore]     = useState(initialFeed.length === 20);
  const [catFilter, setCatFilter] = useState("all");

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

  // Only show categories that actually have menus
  const presentCategories = new Set(adminMenus.map(m => m.menu_category));
  const catFilters = [
    { key: "all", label: "Tümü" },
    ...Object.entries(MENU_CATEGORY_LABELS)
      .filter(([k]) => presentCategories.has(k))
      .map(([k, v]) => ({ key: k, label: v.label })),
  ];

  const filteredAdminMenus = catFilter === "all"
    ? adminMenus
    : adminMenus.filter(m => m.menu_category === catFilter);

  return (
    <div>
      {/* ── Editörün Menü Önerileri ── */}
      {adminMenus.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-warm-800">Editörün Menü Önerileri</h2>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 [&::-webkit-scrollbar]:hidden">
            {catFilters.map(f => (
              <button key={f.key}
                onClick={() => setCatFilter(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  catFilter === f.key
                    ? "bg-brand-600 text-white"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {filteredAdminMenus.map(m => (
              <AdminMenuCard key={m.id} menu={m} />
            ))}
            {filteredAdminMenus.length === 0 && (
              <p className="text-sm text-warm-400 py-4">Bu kategoride menü yok</p>
            )}
          </div>
        </div>
      )}

      {/* ── Menü Günlüğü Akışı ── */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-extrabold text-warm-800">Menü Günlüğü Akışı</h2>
        <div className="flex-1 h-px bg-warm-100" />
      </div>

      <div>
        {feed.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📔</p>
            <p className="text-sm text-warm-500 mb-1">Henüz paylaşım yok</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {feed.map(p => (
            <FeedCard key={p.id} post={p} />
          ))}
        </div>

        {hasMore && (
          <button onClick={loadMore} disabled={loading}
            className="w-full py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl border border-warm-200 transition-colors disabled:opacity-50 mt-4">
            {loading ? "Yükleniyor…" : "Daha fazla göster"}
          </button>
        )}
      </div>
    </div>
  );
}
