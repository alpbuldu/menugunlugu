"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { zipSync } from "fflate";
import type { Category } from "@/lib/types";
import type { MenuRecipe } from "./page";
import { trMatch } from "@/lib/turkishSearch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedPost {
  id: string;
  user_id: string;
  created_at: string;
  soup_title: string | null;
  main_title: string | null;
  side_title: string | null;
  dessert_title: string | null;
  soup_slug: string | null;
  main_slug: string | null;
  side_slug: string | null;
  dessert_slug: string | null;
  likes_count: number;
  saves_count: number;
  category: string | null;
  author: { username: string; avatar_url: string | null };
}

interface TodayMenu {
  id: string;
  date: string;
  soup: SlimRecipe | null;
  main: SlimRecipe | null;
  side: SlimRecipe | null;
  dessert: SlimRecipe | null;
}

interface SlimRecipe {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  kcal_per_person: number | null;
}

interface SavedMenu {
  id: string;
  created_at: string;
  soup: SlimRecipe | null;
  main: SlimRecipe | null;
  side: SlimRecipe | null;
  dessert: SlimRecipe | null;
}

type Selection = Partial<Record<Category, MenuRecipe>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOTS: { key: Category; label: string; emoji: string }[] = [
  { key: "soup",    label: "Çorba",          emoji: "🥣" },
  { key: "main",    label: "Ana Yemek",       emoji: "🍽️" },
  { key: "side",    label: "Yardımcı Lezzet", emoji: "🥗" },
  { key: "dessert", label: "Tatlı",           emoji: "🍮" },
];

const CATEGORY_LABELS: Record<Category, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı", dessert: "Tatlı",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const s = `${size}px`;
  if (url) return <img src={url} alt={name} style={{ width: s, height: s }} className="rounded-full object-cover flex-shrink-0" />;
  return (
    <span style={{ width: s, height: s }}
      className="rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function MealRow({ emoji, label, title, slug }: { emoji: string; label: string; title: string | null; slug: string | null }) {
  const inner = (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-base leading-none mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-warm-400 font-medium leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-warm-800 leading-snug line-clamp-1">{title ?? "—"}</p>
      </div>
    </div>
  );
  if (slug) return <Link href={`/recipes/${slug}`} className="hover:opacity-75 transition-opacity block">{inner}</Link>;
  return inner;
}

// ─── Akış Tab ─────────────────────────────────────────────────────────────────

function TodayCard({ menu }: { menu: TodayMenu }) {
  const [downloading, setDownloading] = useState(false);
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul",
  });
  const allFilled = menu.soup && menu.main && menu.side && menu.dessert;

  function buildParams(format: string) {
    const p = new URLSearchParams({
      soup:    menu.soup?.id    ?? "",
      main:    menu.main?.id    ?? "",
      side:    menu.side?.id    ?? "",
      dessert: menu.dessert?.id ?? "",
      format,
    });
    return p.toString();
  }

  async function handlePost() {
    if (!allFilled || downloading) return;
    setDownloading(true);
    const labels = ["kapak", "corba", "ana-yemek", "yardimci", "tatli"];
    const base = buildParams("post");
    const urls = [
      `/api/menu-karti?${base}`,
      ...[1,2,3,4].map(i => `/api/menu-karti?${base}&slide=${i}`),
    ];
    try {
      const blobs = await Promise.all(urls.map(u => fetch(u).then(r => r.ok ? r.blob() : null)));
      const buffers = await Promise.all(blobs.map(b => b?.arrayBuffer() ?? Promise.resolve(null)));
      const files: Record<string, Uint8Array> = {};
      buffers.forEach((buf, i) => { if (buf) files[`${labels[i]}.png`] = new Uint8Array(buf); });
      const zip = zipSync(files, { level: 0 });
      const zipArr: BlobPart = zip.buffer as ArrayBuffer;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([zipArr], { type: "application/zip" }));
      a.download = "gunun-menusu.zip"; document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
    } finally { setDownloading(false); }
  }

  function handleStory() {
    if (!allFilled) return;
    window.open(`/api/menu-karti?${buildParams("story")}`, "_blank");
  }

  const totalKcal = [menu.soup, menu.main, menu.side, menu.dessert]
    .reduce((s, r) => s + (r?.kcal_per_person ?? 0), 0);

  return (
    <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-brand-200 text-[11px] font-semibold uppercase tracking-wider">Bugünün Resmi Menüsü</p>
          <p className="text-white font-bold text-sm capitalize">{today}</p>
        </div>
        {totalKcal > 0 && (
          <span className="text-brand-200 text-xs font-semibold">{totalKcal} kcal</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { r: menu.soup,    e: "🥣", l: "Çorba" },
          { r: menu.main,    e: "🍽️", l: "Ana Yemek" },
          { r: menu.side,    e: "🥗", l: "Yardımcı" },
          { r: menu.dessert, e: "🍮", l: "Tatlı" },
        ].map(({ r, e, l }) => (
          <div key={l} className="bg-white/10 rounded-xl p-2.5">
            <p className="text-brand-200 text-[10px] font-medium mb-0.5">{e} {l}</p>
            <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{r?.title ?? "—"}</p>
            {r?.kcal_per_person ? <p className="text-brand-300 text-[10px] mt-0.5">{r.kcal_per_person} kcal</p> : null}
          </div>
        ))}
      </div>
      {allFilled && (
        <div className="flex gap-2">
          <button onClick={handlePost} disabled={downloading}
            className="flex-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors disabled:opacity-50">
            {downloading ? "Hazırlanıyor…" : "📲 Post İndir"}
          </button>
          <button onClick={handleStory}
            className="flex-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors">
            📱 Story İndir
          </button>
        </div>
      )}
    </div>
  );
}

function FeedCard({ post }: { post: FeedPost }) {
  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar url={post.author.avatar_url} name={post.author.username} size={32} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-warm-800 truncate">@{post.author.username}</p>
          <p className="text-[11px] text-warm-400">{timeAgo(post.created_at)}</p>
        </div>
        {post.category && (
          <span className="text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full flex-shrink-0">
            {post.category}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0 divide-y divide-warm-50">
        <MealRow emoji="🥣" label="Çorba"    title={post.soup_title}    slug={post.soup_slug} />
        <MealRow emoji="🍽️" label="Ana"      title={post.main_title}    slug={post.main_slug} />
        <MealRow emoji="🥗" label="Yardımcı" title={post.side_title}    slug={post.side_slug} />
        <MealRow emoji="🍮" label="Tatlı"    title={post.dessert_title} slug={post.dessert_slug} />
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-warm-50">
        <span className="text-[11px] text-warm-400">❤️ {post.likes_count}</span>
        <span className="text-[11px] text-warm-400">🔖 {post.saves_count}</span>
      </div>
    </div>
  );
}

function AkisTab({ todayMenu, initialFeed }: { todayMenu: TodayMenu | null; initialFeed: FeedPost[] }) {
  const [feed, setFeed]       = useState<FeedPost[]>(initialFeed);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialFeed.length === 20);

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

  return (
    <div className="space-y-3">
      {todayMenu && <TodayCard menu={todayMenu} />}
      {feed.map(p => <FeedCard key={p.id} post={p} />)}
      {feed.length === 0 && !todayMenu && (
        <div className="text-center py-12 text-warm-400">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm">Henüz paylaşım yok</p>
        </div>
      )}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}
          className="w-full py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl border border-warm-200 transition-colors disabled:opacity-50">
          {loading ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}

// ─── Oluştur Tab ──────────────────────────────────────────────────────────────

function SlotButton({ slot, recipe, active, onClick, onClear }: {
  slot: { key: Category; label: string; emoji: string };
  recipe: MenuRecipe | undefined;
  active: boolean;
  onClick: () => void;
  onClear: () => void;
}) {
  return (
    <div className={`relative rounded-xl border-2 transition-all cursor-pointer ${
      active ? "border-brand-500 bg-brand-50" : recipe ? "border-brand-200 bg-white" : "border-warm-200 bg-white"
    }`} onClick={onClick}>
      <div className="p-3">
        <p className="text-[10px] font-semibold text-warm-400 mb-1">{slot.emoji} {slot.label}</p>
        {recipe ? (
          <div className="flex items-center gap-2">
            {recipe.image_url && (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-warm-800 leading-snug line-clamp-2">{recipe.title}</p>
              {recipe.kcal_per_person && <p className="text-[10px] text-brand-500 font-semibold">{recipe.kcal_per_person} kcal</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-warm-400">Seçilmedi</p>
        )}
      </div>
      {recipe && (
        <button onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-warm-100 hover:bg-warm-200 flex items-center justify-center transition-colors text-warm-500 text-xs">
          ×
        </button>
      )}
    </div>
  );
}

function RecipeItem({ recipe, selected, onSelect }: {
  recipe: MenuRecipe; selected: boolean; onSelect: () => void;
}) {
  return (
    <button onClick={onSelect}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
        selected ? "border-brand-400 bg-brand-50" : "border-warm-100 bg-white hover:border-warm-200 hover:bg-warm-50"
      }`}>
      {recipe.image_url ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0 text-lg">
          {SLOTS.find(s => s.key === recipe.category)?.emoji ?? "🍴"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-warm-800 line-clamp-1">{recipe.title}</p>
        <p className="text-[11px] text-warm-400">{recipe.author}</p>
      </div>
      {recipe.kcal_per_person && (
        <span className="text-[10px] font-bold text-brand-500 flex-shrink-0">{recipe.kcal_per_person} kcal</span>
      )}
      {selected && <span className="text-brand-500 flex-shrink-0">✓</span>}
    </button>
  );
}

function OlusturTab({ grouped }: { grouped: Record<Category, MenuRecipe[]> }) {
  const [selection, setSelection]       = useState<Selection>({});
  const [activeSlot, setActiveSlot]     = useState<Category>("soup");
  const [search, setSearch]             = useState("");
  const [downloading, setDownloading]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [publishing, setPublishing]     = useState(false);
  const [toast, setToast]               = useState<string | null>(null);

  const allFilled = SLOTS.every(s => !!selection[s.key]);
  const currentRecipes = grouped[activeSlot];
  const filtered = search.trim()
    ? currentRecipes.filter(r => trMatch(r.title, search) || trMatch(r.author, search))
    : currentRecipes;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function selectRecipe(r: MenuRecipe) {
    setSelection(prev => ({ ...prev, [activeSlot]: r }));
    const idx = SLOTS.findIndex(s => s.key === activeSlot);
    const next = SLOTS[idx + 1];
    if (next) { setActiveSlot(next.key); setSearch(""); }
  }

  function buildParams(format: string) {
    const sel = selection as Record<Category, MenuRecipe>;
    return new URLSearchParams({ soup: sel.soup.id, main: sel.main.id, side: sel.side.id, dessert: sel.dessert.id, format }).toString();
  }

  async function handlePost() {
    if (!allFilled || downloading) return;
    setDownloading(true);
    const labels = ["kapak", "corba", "ana-yemek", "yardimci", "tatli"];
    const base = buildParams("post");
    const urls = [`/api/menu-karti?${base}`, ...[1,2,3,4].map(i => `/api/menu-karti?${base}&slide=${i}`)];
    try {
      const blobs = await Promise.all(urls.map(u => fetch(u).then(r => r.ok ? r.blob() : null)));
      const buffers = await Promise.all(blobs.map(b => b?.arrayBuffer() ?? Promise.resolve(null)));
      const files: Record<string, Uint8Array> = {};
      buffers.forEach((buf, i) => { if (buf) files[`${labels[i]}.png`] = new Uint8Array(buf); });
      const zip = zipSync(files, { level: 0 });
      const zipArr2: BlobPart = zip.buffer as ArrayBuffer;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([zipArr2], { type: "application/zip" }));
      a.download = "menu.zip"; document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
    } finally { setDownloading(false); }
  }

  function handleStory() {
    if (!allFilled) return;
    window.open(`/api/menu-karti?${buildParams("story")}`, "_blank");
  }

  async function handleSave() {
    if (!allFilled || saving) return;
    setSaving(true);
    const sel = selection as Record<Category, MenuRecipe>;
    try {
      const res = await fetch("/api/menu-gunlugu/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soup_id: sel.soup.id, main_id: sel.main.id, side_id: sel.side.id, dessert_id: sel.dessert.id }),
      });
      if (res.status === 401) { showToast("Kaydetmek için giriş yapın"); return; }
      if (!res.ok) throw new Error();
      showToast("Menü defterinize kaydedildi ✓");
    } catch { showToast("Kaydedilemedi, tekrar deneyin"); } finally { setSaving(false); }
  }

  async function handlePublish() {
    if (!allFilled || publishing) return;
    setPublishing(true);
    const sel = selection as Record<Category, MenuRecipe>;
    try {
      const res = await fetch("/api/menu-gunlugu/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soup_id: sel.soup.id, main_id: sel.main.id, side_id: sel.side.id, dessert_id: sel.dessert.id }),
      });
      if (res.status === 401) { showToast("Paylaşmak için giriş yapın"); return; }
      if (!res.ok) throw new Error();
      showToast("Menünüz akışa paylaşıldı ✓");
    } catch { showToast("Paylaşılamadı, tekrar deneyin"); } finally { setPublishing(false); }
  }

  const totalKcal = SLOTS.reduce((s, sl) => s + (selection[sl.key]?.kcal_per_person ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warm-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Slot grid */}
      <div className="grid grid-cols-2 gap-2">
        {SLOTS.map(slot => (
          <SlotButton
            key={slot.key}
            slot={slot}
            recipe={selection[slot.key]}
            active={activeSlot === slot.key}
            onClick={() => { setActiveSlot(slot.key); setSearch(""); }}
            onClear={() => setSelection(prev => { const n = { ...prev }; delete n[slot.key]; return n; })}
          />
        ))}
      </div>

      {/* Toplam kcal */}
      {totalKcal > 0 && (
        <p className="text-right text-xs text-warm-400 font-semibold">Toplam: {totalKcal} kcal</p>
      )}

      {/* Eylem butonları */}
      {allFilled && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handlePost} disabled={downloading}
            className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors disabled:opacity-50">
            {downloading ? "Hazırlanıyor…" : "📲 Post İndir"}
          </button>
          <button onClick={handleStory}
            className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors">
            📱 Story İndir
          </button>
          <button onClick={handleSave} disabled={saving}
            className="py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold transition-colors disabled:opacity-50">
            {saving ? "Kaydediliyor…" : "🔖 Defterime Kaydet"}
          </button>
          <button onClick={handlePublish} disabled={publishing}
            className="py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold transition-colors disabled:opacity-50">
            {publishing ? "Paylaşılıyor…" : "📢 Akışa Paylaş"}
          </button>
        </div>
      )}

      {/* Tarif seçici */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
        {/* Kategori sekmeleri */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {SLOTS.map(s => (
            <button key={s.key} onClick={() => { setActiveSlot(s.key); setSearch(""); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSlot === s.key ? "bg-brand-100 text-brand-700" : "text-warm-500 hover:bg-warm-100"
              }`}>
              {s.emoji} {s.label}
              {selection[s.key] && <span className="ml-1 text-brand-400">✓</span>}
            </button>
          ))}
        </div>

        {/* Arama */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`${SLOTS.find(s => s.key === activeSlot)?.label ?? ""} ara…`}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-warm-50 border border-warm-200 text-sm text-warm-700 placeholder:text-warm-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 transition-colors"
        />

        {/* Tarif listesi */}
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-sm text-warm-400">Tarif bulunamadı</p>
          ) : filtered.map(r => (
            <RecipeItem
              key={r.id}
              recipe={r}
              selected={selection[activeSlot]?.id === r.id}
              onSelect={() => selectRecipe(r)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Defterim Tab ─────────────────────────────────────────────────────────────

function DefterimTab() {
  const [menus, setMenus]     = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu-gunlugu/saved");
      if (res.status === 401) { setLoggedIn(false); return; }
      const data = await res.json();
      setMenus(data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    await fetch(`/api/menu-gunlugu/saved?id=${id}`, { method: "DELETE" });
    setMenus(m => m.filter(x => x.id !== id));
  }

  if (!loggedIn) return (
    <div className="text-center py-12">
      <p className="text-3xl mb-3">🔒</p>
      <p className="text-sm font-semibold text-warm-700 mb-4">Menü defterinizi görüntülemek için giriş yapın</p>
      <Link href="/giris" className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors">
        Giriş Yap
      </Link>
    </div>
  );

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-warm-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (menus.length === 0) return (
    <div className="text-center py-12 text-warm-400">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-sm">Henüz kaydedilmiş menünüz yok</p>
      <p className="text-xs mt-1">Oluştur sekmesinden menünüzü oluşturup kaydedebilirsiniz</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {menus.map(m => {
        const totalKcal = [m.soup, m.main, m.side, m.dessert]
          .reduce((s, r) => s + (r?.kcal_per_person ?? 0), 0);
        const meals = [
          { r: m.soup,    e: "🥣", l: "Çorba" },
          { r: m.main,    e: "🍽️", l: "Ana Yemek" },
          { r: m.side,    e: "🥗", l: "Yardımcı" },
          { r: m.dessert, e: "🍮", l: "Tatlı" },
        ].filter(x => x.r);

        return (
          <div key={m.id} className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-warm-700">{fmtDate(m.created_at)}</p>
                {totalKcal > 0 && <p className="text-[11px] text-brand-500 font-semibold">{totalKcal} kcal</p>}
              </div>
              <button onClick={() => handleDelete(m.id)}
                className="text-[11px] text-warm-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                Sil
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              {meals.map(({ r, e, l }) => (
                <div key={l} className="flex items-center gap-1.5 py-1">
                  <span className="text-sm flex-shrink-0">{e}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-warm-400">{l}</p>
                    <p className="text-xs font-semibold text-warm-800 line-clamp-1">{r?.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: "akis",    label: "Akış",    emoji: "📡" },
  { key: "olustur", label: "Oluştur", emoji: "✨" },
  { key: "defterim",label: "Defterim",emoji: "📋" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function MenuGunluguClient({
  grouped,
  todayMenu,
  initialFeed,
  adminProfile,
}: {
  grouped: Record<Category, MenuRecipe[]>;
  todayMenu: TodayMenu | null;
  initialFeed: FeedPost[];
  adminProfile: { username: string; avatar_url: string | null } | null;
}) {
  const [tab, setTab] = useState<Tab>("akis");

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900">Menü Günlüğü 📔</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-warm-100 p-1 rounded-2xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
              tab === t.key
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700"
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab içerikleri */}
      {tab === "akis"     && <AkisTab todayMenu={todayMenu} initialFeed={initialFeed} />}
      {tab === "olustur"  && <OlusturTab grouped={grouped} />}
      {tab === "defterim" && <DefterimTab />}
    </div>
  );
}
