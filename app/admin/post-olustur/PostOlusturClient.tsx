"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { zipSync } from "fflate";

/* ── Types ─────────────────────────────────────────────────── */
interface SimpleRecipe {
  id: string;
  title: string;
  category: string;
}

interface Props {
  recipes: SimpleRecipe[];
}

type ContentMode = "both" | "ingredients" | "steps" | "none";
type CoverType   = "yazili" | "yazisiz";
type MainTab     = "gunmenu" | "paket";

interface SlotState {
  soup:    SimpleRecipe | null;
  main:    SimpleRecipe | null;
  side:    SimpleRecipe | null;
  dessert: SimpleRecipe | null;
}

/* ── Constants ──────────────────────────────────────────────── */
const COLORS = ["#D2740B", "#92400E", "#3D412A", "#B8B3AE", "#D0B88D", "#948E5C"] as const;

const COLOR_LABELS: Record<string, string> = {
  "#D2740B": "Turuncu",
  "#92400E": "Kahve",
  "#3D412A": "Zeytin",
  "#B8B3AE": "Gri",
  "#D0B88D": "Kum",
  "#948E5C": "Haki",
};

const SLOT_LABELS: Record<keyof SlotState, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const CAT_COLORS: Record<string, string> = {
  soup:    "bg-blue-50 text-blue-700",
  main:    "bg-orange-50 text-orange-700",
  side:    "bg-green-50 text-green-700",
  dessert: "bg-pink-50 text-pink-700",
};

const CAT_EMOJI: Record<string, string> = {
  soup: "🥣", main: "🥘", side: "🥗", dessert: "🍮",
};

/* ── Helpers ────────────────────────────────────────────────── */
function safeFilename(title: string, suffix?: string): string {
  const base = title.replace(/[^a-z0-9çğıöşüÇĞİÖŞÜ\s]/gi, "").replace(/\s+/g, "_").slice(0, 40);
  return suffix ? `${base}_${suffix}.png` : `${base}.png`;
}

function slotsComplete(slots: SlotState): boolean {
  return !!(slots.soup && slots.main && slots.side && slots.dessert);
}

function slotParams(slots: SlotState): string {
  return `soup=${slots.soup!.id}&main=${slots.main!.id}&side=${slots.side!.id}&dessert=${slots.dessert!.id}`;
}

async function fetchTodaysMenuApi(): Promise<SlotState | null> {
  const res = await fetch("/api/menu/today");
  if (!res.ok) return null;
  const { menu } = await res.json();
  const toSimple = (r: { id: string; title: string; category: string } | null) =>
    r ? { id: r.id, title: r.title, category: r.category } : null;
  return {
    soup:    toSimple(menu.soup),
    main:    toSimple(menu.main),
    side:    toSimple(menu.side),
    dessert: toSimple(menu.dessert),
  };
}

/* ── Sub: ColorPicker ───────────────────────────────────────── */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={COLOR_LABELS[c]}
          className={`w-10 h-10 rounded-full border-2 transition-transform ${
            value === c ? "border-warm-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <span className="self-center text-xs text-warm-400 ml-1">{COLOR_LABELS[value] ?? value}</span>
    </div>
  );
}

/* ── Sub: RecipeSearchInput ─────────────────────────────────── */
function RecipeSearchInput({
  recipes, value, onChange, label, excludeIds,
}: {
  recipes: SimpleRecipe[];
  value: SimpleRecipe | null;
  onChange: (r: SimpleRecipe | null) => void;
  label: string;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return recipes.filter(r => !excludeIds?.includes(r.id)).slice(0, 20);
    const q = query.toLowerCase();
    return recipes.filter(r => !excludeIds?.includes(r.id) && r.title.toLowerCase().includes(q)).slice(0, 20);
  }, [query, recipes, excludeIds]);

  function selectRecipe(r: SimpleRecipe) { onChange(r); setQuery(""); setOpen(false); }
  function clearRecipe()                  { onChange(null); setQuery(""); }

  return (
    <div className="relative">
      <div className="text-xs font-semibold text-warm-600 mb-1">{label}</div>
      {value ? (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CAT_COLORS[value.category] ?? "bg-gray-100 text-gray-600"}`}>
            {SLOT_LABELS[value.category as keyof SlotState] ?? value.category}
          </span>
          <span className="flex-1 text-sm text-warm-800 truncate">{value.title}</span>
          <button onClick={clearRecipe} className="text-warm-400 hover:text-warm-700 text-lg leading-none">×</button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Tarif ara..."
            className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
            style={{ fontSize: 16 }}
          />
          {open && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-warm-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onMouseDown={() => selectRecipe(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-warm-50 text-sm"
                >
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CAT_COLORS[r.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {SLOT_LABELS[r.category as keyof SlotState] ?? r.category}
                  </span>
                  <span className="truncate text-warm-800">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub: FourSlotSelector (full recipe list) ───────────────── */
function FourSlotSelector({
  recipes, slots, onChange,
}: {
  recipes: SimpleRecipe[];
  slots: SlotState;
  onChange: (key: keyof SlotState, r: SimpleRecipe | null) => void;
}) {
  const usedIds = Object.values(slots).filter(Boolean).map(r => r!.id);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(Object.keys(SLOT_LABELS) as (keyof SlotState)[]).map((key) => (
        <RecipeSearchInput
          key={key}
          recipes={recipes}
          value={slots[key]}
          onChange={(r) => onChange(key, r)}
          label={SLOT_LABELS[key]}
          excludeIds={usedIds.filter(id => id !== slots[key]?.id)}
        />
      ))}
    </div>
  );
}

/* ── Sub: PaketSlotSelector (from paket recipes only) ────────── */
function PaketSlotSelector({
  available, slots, onChange,
}: {
  available: SimpleRecipe[];
  slots: SlotState;
  onChange: (key: keyof SlotState, r: SimpleRecipe | null) => void;
}) {
  const usedIds = Object.values(slots).filter(Boolean).map(r => r!.id);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(Object.keys(SLOT_LABELS) as (keyof SlotState)[]).map((key) => {
        const current = slots[key];
        const opts = available.filter(r => !usedIds.includes(r.id) || r.id === current?.id);
        return (
          <div key={key}>
            <label className="text-xs font-semibold text-warm-600 mb-1 block">{SLOT_LABELS[key]}</label>
            <select
              value={current?.id ?? ""}
              onChange={(e) => {
                const r = available.find(r => r.id === e.target.value) ?? null;
                onChange(key, r);
              }}
              className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white"
              style={{ fontSize: 16 }}
            >
              <option value="">— Seçiniz —</option>
              {opts.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

/* ── Sub: SpinnerIcon ───────────────────────────────────────── */
function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.3}/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function PostOlusturClient({ recipes }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>("gunmenu");
  const [isMobile, setIsMobile]   = useState(false);
  useEffect(() => { setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)); }, []);

  /* ════ GÜNÜN MENÜSÜ state ════════════════════════════════════ */
  const [gunColor,        setGunColor]        = useState("#92400E");
  const [gunSlots,        setGunSlots]        = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  const [gunNot,          setGunNot]          = useState("");
  const [gunLoading,      setGunLoading]      = useState(false);
  const [gunFetch,        setGunFetch]        = useState(false);
  const [gunCopied,       setGunCopied]       = useState(false);
  const [showGunMenu,     setShowGunMenu]     = useState(false);
  const [gunPrefetching,  setGunPrefetching]  = useState(false);
  const gunMenuRef    = useRef<HTMLDivElement>(null);
  const gunPrefetchRef  = useRef<{ files: File[]; caption: string } | null>(null);
  const gunStoryRef     = useRef<File | null>(null);
  const gunComplete = slotsComplete(gunSlots);

  /* ── Günün Menüsü: prefetch post files when platform menu opens ── */
  const gunSlotKey = `${gunSlots.soup?.id}-${gunSlots.main?.id}-${gunSlots.side?.id}-${gunSlots.dessert?.id}`;
  useEffect(() => {
    if (!showGunMenu || !gunComplete) { gunPrefetchRef.current = null; return; }
    gunPrefetchRef.current = null;
    setGunPrefetching(true);
    const sp  = slotParams(gunSlots);
    const col = encodeURIComponent(gunColor);
    const caption = generateGunCaption(gunSlots, gunNot);
    const urls = [
      `/api/admin-gorsel?mode=cover-yazili&${sp}&color=${col}`,
      `/api/admin-gorsel?mode=post&recipeId=${gunSlots.soup!.id}&color=${col}&content=both`,
      `/api/admin-gorsel?mode=post&recipeId=${gunSlots.main!.id}&color=${col}&content=both`,
      `/api/admin-gorsel?mode=post&recipeId=${gunSlots.side!.id}&color=${col}&content=both`,
      `/api/admin-gorsel?mode=post&recipeId=${gunSlots.dessert!.id}&color=${col}&content=both`,
    ];
    const labels = ["kapak", "corba", "ana-yemek", "yardimci", "tatli"];
    let cancelled = false;
    Promise.all(urls.map(async (url, i) => {
      try { const r = await fetch(url); return r.ok ? new File([await r.blob()], `${labels[i]}.png`, { type: "image/png" }) : null; }
      catch { return null; }
    })).then(files => {
      if (cancelled) return;
      const ok = files.filter(Boolean) as File[];
      if (ok.length > 0) gunPrefetchRef.current = { files: ok, caption };
      setGunPrefetching(false);
    }).catch(() => { if (!cancelled) setGunPrefetching(false); });
    return () => { cancelled = true; setGunPrefetching(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGunMenu, gunSlotKey, gunColor]);

  /* ── Günün Menüsü: prefetch story when slots complete ── */
  useEffect(() => {
    if (!gunComplete) { gunStoryRef.current = null; return; }
    gunStoryRef.current = null;
    const url = `/api/admin-gorsel?mode=story&${slotParams(gunSlots)}&color=${encodeURIComponent(gunColor)}`;
    let cancelled = false;
    fetch(url)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => { if (!cancelled && blob) gunStoryRef.current = new File([blob], "story.png", { type: "image/png" }); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gunSlotKey, gunColor]);

  /* ── Close gun platform menu on outside click ── */
  useEffect(() => {
    if (!showGunMenu) return;
    function h(e: MouseEvent) {
      if (gunMenuRef.current && !gunMenuRef.current.contains(e.target as Node)) setShowGunMenu(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showGunMenu]);

  /* ════ PAKET POST state ══════════════════════════════════════ */
  const [paketRecipes,     setPaketRecipes]     = useState<SimpleRecipe[]>([]);
  const [paketContentMode, setPaketContentMode] = useState<ContentMode>("both");
  const [paketColor,       setPaketColor]       = useState("#92400E");
  const [paketBaslik,      setPaketBaslik]      = useState("");
  const [paketAltMetin,    setPaketAltMetin]    = useState("");
  /* Kapak */
  const [paketKapakEkle,   setPaketKapakEkle]   = useState(false);
  const [paketKapakType,   setPaketKapakType]   = useState<CoverType>("yazili");
  const [paketKapakSlots,  setPaketKapakSlots]  = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  /* Story */
  const [paketStoryEkle,   setPaketStoryEkle]   = useState(false);
  const [paketStorySlots,  setPaketStorySlots]  = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  /* Download / share */
  const [paketLoading,          setPaketLoading]          = useState(false);
  const [paketSearch,           setPaketSearch]           = useState("");
  const [paketNot,              setPaketNot]              = useState("");
  const [paketCopied,           setPaketCopied]           = useState(false);
  const [paketMenuFetch,        setPaketMenuFetch]        = useState(false);
  const [showPaketMenu,         setShowPaketMenu]         = useState(false);
  const [paketPrefetching,      setPaketPrefetching]      = useState(false);
  const [showPaketStoryMenu,    setShowPaketStoryMenu]    = useState(false);
  const paketMenuRef      = useRef<HTMLDivElement>(null);
  const paketStoryMenuRef = useRef<HTMLDivElement>(null);
  const paketPrefetchRef      = useRef<{ files: File[]; caption: string } | null>(null);
  const paketStoryPrefetchRef = useRef<File | null>(null);

  const paketIds = paketRecipes.map(r => r.id);
  const paketComplete = paketRecipes.length > 0;

  const filteredForPaket = useMemo(() => {
    if (!paketSearch.trim()) return recipes.filter(r => !paketIds.includes(r.id)).slice(0, 30);
    const q = paketSearch.toLowerCase();
    return recipes.filter(r => !paketIds.includes(r.id) && r.title.toLowerCase().includes(q)).slice(0, 30);
  }, [paketSearch, recipes, paketIds]);

  function togglePaket(r: SimpleRecipe) {
    if (paketIds.includes(r.id)) {
      setPaketRecipes(prev => prev.filter(x => x.id !== r.id));
    } else if (paketRecipes.length < 10) {
      setPaketRecipes(prev => [...prev, r]);
    }
  }

  /* ── Paket: invalidate kapak/story slots when recipe list changes ── */
  const paketIdKey = paketIds.join(",");
  useEffect(() => {
    setPaketKapakSlots(prev => ({
      soup:    prev.soup    && paketIds.includes(prev.soup.id)    ? prev.soup    : null,
      main:    prev.main    && paketIds.includes(prev.main.id)    ? prev.main    : null,
      side:    prev.side    && paketIds.includes(prev.side.id)    ? prev.side    : null,
      dessert: prev.dessert && paketIds.includes(prev.dessert.id) ? prev.dessert : null,
    }));
    setPaketStorySlots(prev => ({
      soup:    prev.soup    && paketIds.includes(prev.soup.id)    ? prev.soup    : null,
      main:    prev.main    && paketIds.includes(prev.main.id)    ? prev.main    : null,
      side:    prev.side    && paketIds.includes(prev.side.id)    ? prev.side    : null,
      dessert: prev.dessert && paketIds.includes(prev.dessert.id) ? prev.dessert : null,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paketIdKey]);

  /* ── Paket: prefetch post files when platform menu opens ── */
  useEffect(() => {
    if (!showPaketMenu || paketRecipes.length === 0) { paketPrefetchRef.current = null; return; }
    paketPrefetchRef.current = null;
    setPaketPrefetching(true);
    const col     = encodeURIComponent(paketColor);
    const caption = generatePaketCaption(paketRecipes, paketNot);
    const baslik  = paketBaslik   ? `&headerTitle=${encodeURIComponent(paketBaslik)}`   : "";
    const alt     = paketAltMetin ? `&headerDate=${encodeURIComponent(paketAltMetin)}`  : "";

    const kapakUrl = (paketKapakEkle && slotsComplete(paketKapakSlots))
      ? (() => {
          const mode = paketKapakType === "yazili" ? "cover-yazili" : "cover-yazisiz";
          return `/api/admin-gorsel?mode=${mode}&${slotParams(paketKapakSlots)}&color=${col}${paketKapakType === "yazili" ? baslik + alt : ""}`;
        })()
      : null;

    const postUrls = paketRecipes.map(r =>
      `/api/admin-gorsel?mode=post&recipeId=${r.id}&color=${col}&content=${paketContentMode}${baslik}${alt}`
    );
    const allUrls    = kapakUrl ? [kapakUrl, ...postUrls] : postUrls;
    const allLabels  = kapakUrl
      ? ["kapak", ...paketRecipes.map((_, i) => `post-${i + 1}`)]
      : paketRecipes.map((_, i) => `post-${i + 1}`);

    let cancelled = false;
    Promise.all(allUrls.map(async (url, i) => {
      try { const r = await fetch(url); return r.ok ? new File([await r.blob()], `${allLabels[i]}.png`, { type: "image/png" }) : null; }
      catch { return null; }
    })).then(files => {
      if (cancelled) return;
      const ok = files.filter(Boolean) as File[];
      if (ok.length > 0) paketPrefetchRef.current = { files: ok, caption };
      setPaketPrefetching(false);
    }).catch(() => { if (!cancelled) setPaketPrefetching(false); });
    return () => { cancelled = true; setPaketPrefetching(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaketMenu, paketIdKey, paketColor, paketContentMode, paketKapakEkle,
      paketKapakSlots.soup?.id, paketKapakSlots.main?.id, paketKapakSlots.side?.id, paketKapakSlots.dessert?.id,
      paketKapakType, paketBaslik, paketAltMetin]);

  /* ── Paket: prefetch story ── */
  const paketStoryKey = `${paketStorySlots.soup?.id}-${paketStorySlots.main?.id}-${paketStorySlots.side?.id}-${paketStorySlots.dessert?.id}-${paketColor}`;
  useEffect(() => {
    if (!paketStoryEkle || !slotsComplete(paketStorySlots)) { paketStoryPrefetchRef.current = null; return; }
    paketStoryPrefetchRef.current = null;
    const url = `/api/admin-gorsel?mode=story&color=${encodeURIComponent(paketColor)}&${slotParams(paketStorySlots)}`;
    let cancelled = false;
    fetch(url)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => { if (!cancelled && blob) paketStoryPrefetchRef.current = new File([blob], "story.png", { type: "image/png" }); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paketStoryKey, paketStoryEkle]);

  /* ── Close paket menus on outside click ── */
  useEffect(() => {
    if (!showPaketMenu && !showPaketStoryMenu) return;
    function h(e: MouseEvent) {
      if (showPaketMenu && paketMenuRef.current && !paketMenuRef.current.contains(e.target as Node)) setShowPaketMenu(false);
      if (showPaketStoryMenu && paketStoryMenuRef.current && !paketStoryMenuRef.current.contains(e.target as Node)) setShowPaketStoryMenu(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showPaketMenu, showPaketStoryMenu]);

  /* ════ Caption generators ═══════════════════════════════════ */
  function generateGunCaption(slots: SlotState, not: string): string {
    const today = new Date().toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul", day: "numeric", month: "long", weekday: "long",
    });
    const menu = [
      slots.soup    ? `🥣 ${slots.soup.title}`    : null,
      slots.main    ? `🥘 ${slots.main.title}`    : null,
      slots.side    ? `🥗 ${slots.side.title}`    : null,
      slots.dessert ? `🍮 ${slots.dessert.title}` : null,
    ].filter(Boolean).join("\n");
    const lines = [
      `🍽️ ${today} | Günün Menüsü Hazır!`,
      menu,
      `📖 Menü Günlüğü; günlük menüler keşfedebileceğin, tariflere ulaşabileceğin, kendi menünü oluşturabileceğin ve gastronomiye dair içerikleri takip edebileceğin dijital bir gastronomi platformudur.`,
      `📌 Görsellerde tariflerin tamamı yer almayabilir. Tarifin tamamı ve daha fazlası için menugunlugu.com'u ziyaret edin.`,
    ];
    if (not.trim()) lines.push(not.trim());
    lines.push(`#GününMenüsü #MenüGünlüğü`);
    return lines.join("\n\n");
  }

  function generateGunXCaption(slots: SlotState): string {
    const today = new Date().toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul", day: "numeric", month: "long", weekday: "long",
    });
    const menu = [
      slots.soup    ? `🥣 ${slots.soup.title}`    : null,
      slots.main    ? `🥘 ${slots.main.title}`    : null,
      slots.side    ? `🥗 ${slots.side.title}`    : null,
      slots.dessert ? `🍮 ${slots.dessert.title}` : null,
    ].filter(Boolean).join("\n");
    return `🍽️ ${today} | Günün Menüsü Hazır!\n\n${menu}\n\n📖 Tarif detayları ve daha fazla içerik için menugunlugu.com'u ziyaret edin.`;
  }

  function generatePaketCaption(recs: SimpleRecipe[], not: string): string {
    const today = new Date().toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul", day: "numeric", month: "long", weekday: "long",
    });
    const list = recs.map(r => `${CAT_EMOJI[r.category] ?? "🍽️"} ${r.title}`).join("\n");
    const lines = [
      `🍽️ ${today} | Menü Hazır!`,
      list,
      `📖 Tarifin tamamına ulaşmak ve daha fazla içerik için menugunlugu.com'u ziyaret edin.`,
    ];
    if (not.trim()) lines.push(not.trim());
    lines.push("#GününMenüsü #MenüGünlüğü");
    return lines.join("\n\n");
  }

  /* ════ URL builders ══════════════════════════════════════════ */
  function buildPaketPostUrl(recipeId: string): string {
    let url = `/api/admin-gorsel?mode=post&recipeId=${recipeId}&color=${encodeURIComponent(paketColor)}&content=${paketContentMode}`;
    if (paketBaslik)   url += `&headerTitle=${encodeURIComponent(paketBaslik)}`;
    if (paketAltMetin) url += `&headerDate=${encodeURIComponent(paketAltMetin)}`;
    return url;
  }

  function buildPaketKapakUrl(): string {
    const mode = paketKapakType === "yazili" ? "cover-yazili" : "cover-yazisiz";
    let url = `/api/admin-gorsel?mode=${mode}&${slotParams(paketKapakSlots)}&color=${encodeURIComponent(paketColor)}`;
    if (paketKapakType === "yazili") {
      if (paketBaslik)   url += `&headerTitle=${encodeURIComponent(paketBaslik)}`;
      if (paketAltMetin) url += `&headerDate=${encodeURIComponent(paketAltMetin)}`;
    }
    return url;
  }

  /* ════ Share helper ══════════════════════════════════════════ */
  function mobileShare(
    getFiles: () => File[] | null,
    caption?: string,
    setLoading?: (v: boolean) => void,
  ) {
    if (!navigator.share) return;
    const tryShare = (files: File[]) => {
      if (caption) navigator.clipboard?.writeText(caption).catch(() => {});
      navigator.share({ files, ...(caption ? { text: caption } : {}) }).catch(err => {
        if ((err as Error).name !== "AbortError") {
          navigator.share({ ...(caption ? { text: caption } : {}), url: "https://menugunlugu.com" }).catch(() => {});
        }
      });
      setLoading?.(false);
    };
    const files = getFiles();
    if (files) { tryShare(files); return; }
    setLoading?.(true);
    const poll = setInterval(() => {
      const f = getFiles();
      if (!f) return;
      clearInterval(poll);
      tryShare(f);
    }, 200);
    setTimeout(() => { clearInterval(poll); setLoading?.(false); }, 15000);
  }

  /* ════ Günün Menüsü: actions ════════════════════════════════ */
  async function downloadGunZip() {
    if (!gunComplete) return;
    setGunLoading(true);
    try {
      const files: Record<string, Uint8Array> = {};
      const sp  = slotParams(gunSlots);
      const col = encodeURIComponent(gunColor);
      const entries: [string, string][] = [
        [`/api/admin-gorsel?mode=cover-yazili&${sp}&color=${col}`,  "kapak-yazili.png"],
        [`/api/admin-gorsel?mode=cover-yazisiz&${sp}&color=${col}`, "kapak-yazisiz.png"],
        [`/api/admin-gorsel?mode=post&recipeId=${gunSlots.soup!.id}&color=${col}&content=both`,    "post-corba.png"],
        [`/api/admin-gorsel?mode=post&recipeId=${gunSlots.main!.id}&color=${col}&content=both`,    "post-ana-yemek.png"],
        [`/api/admin-gorsel?mode=post&recipeId=${gunSlots.side!.id}&color=${col}&content=both`,    "post-yardimci.png"],
        [`/api/admin-gorsel?mode=post&recipeId=${gunSlots.dessert!.id}&color=${col}&content=both`, "post-tatli.png"],
        [`/api/admin-gorsel?mode=story&${sp}&color=${col}`, "story.png"],
      ];
      for (const [url, name] of entries) {
        const resp = await fetch(url);
        if (resp.ok) files[name] = new Uint8Array(await resp.arrayBuffer());
      }
      files["caption.txt"] = new TextEncoder().encode(generateGunCaption(gunSlots, gunNot));
      const zip  = zipSync(files);
      const blob = new Blob([zip as unknown as BlobPart], { type: "application/zip" });
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = "gunun-menusu.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setGunLoading(false);
    }
  }

  function handleGunMobileShare(platform: "instagram" | "tiktok" | "x") {
    setShowGunMenu(false);
    const caption = platform === "x"
      ? generateGunXCaption(gunSlots)
      : generateGunCaption(gunSlots, gunNot);
    mobileShare(() => gunPrefetchRef.current?.files ?? null, caption, setGunLoading);
  }

  function handleGunStoryMobile() {
    mobileShare(() => gunStoryRef.current ? [gunStoryRef.current] : null);
  }

  async function fetchGunToday() {
    setGunFetch(true);
    try {
      const s = await fetchTodaysMenuApi();
      if (!s) { alert("Bugün için yayınlanmış menü bulunamadı."); return; }
      setGunSlots(s);
    } catch { alert("Menü getirilemedi."); }
    finally { setGunFetch(false); }
  }

  /* ════ Paket Post: actions ═══════════════════════════════════ */
  async function downloadPaketZip() {
    if (!paketComplete) return;
    setPaketLoading(true);
    try {
      const files: Record<string, Uint8Array> = {};
      const col = encodeURIComponent(paketColor);

      if (paketKapakEkle && slotsComplete(paketKapakSlots)) {
        const resp = await fetch(buildPaketKapakUrl());
        if (resp.ok) files["kapak.png"] = new Uint8Array(await resp.arrayBuffer());
      }

      for (const r of paketRecipes) {
        const resp = await fetch(buildPaketPostUrl(r.id));
        if (resp.ok) files[safeFilename(r.title)] = new Uint8Array(await resp.arrayBuffer());
      }

      if (paketStoryEkle && slotsComplete(paketStorySlots)) {
        const resp = await fetch(`/api/admin-gorsel?mode=story&color=${col}&${slotParams(paketStorySlots)}`);
        if (resp.ok) files["story.png"] = new Uint8Array(await resp.arrayBuffer());
      }

      files["caption.txt"] = new TextEncoder().encode(generatePaketCaption(paketRecipes, paketNot));

      const zip  = zipSync(files);
      const blob = new Blob([zip as unknown as BlobPart], { type: "application/zip" });
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = "paket-post.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setPaketLoading(false);
    }
  }

  function handlePaketMobileShare(platform: "instagram" | "tiktok" | "x") {
    setShowPaketMenu(false);
    const caption = generatePaketCaption(paketRecipes, paketNot);
    mobileShare(() => paketPrefetchRef.current?.files ?? null, caption, setPaketLoading);
  }

  function handlePaketStoryMobile() {
    setShowPaketStoryMenu(false);
    mobileShare(() => paketStoryPrefetchRef.current ? [paketStoryPrefetchRef.current] : null);
  }

  async function fetchPaketToday() {
    setPaketMenuFetch(true);
    try {
      const s = await fetchTodaysMenuApi();
      if (!s) { alert("Bugün için yayınlanmış menü bulunamadı."); return; }
      const toAdd = [s.soup, s.main, s.side, s.dessert].filter(Boolean) as SimpleRecipe[];
      setPaketRecipes(toAdd);
    } catch { alert("Menü getirilemedi."); }
    finally { setPaketMenuFetch(false); }
  }

  /* ════ Render ════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Tab strip ── */}
      <div className="flex gap-2">
        {([
          ["gunmenu", "🍽️ Günün Menüsü"],
          ["paket",   "📦 Paket Post"],
        ] as [MainTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === t
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white border border-warm-200 text-warm-600 hover:border-brand-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          GÜNÜN MENÜSÜ TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === "gunmenu" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-warm-900">Günün Menüsü Paketi</h2>
            <p className="text-sm text-warm-400 mt-1">
              2 kapak + 4 tarif postu + 1 story + caption.txt → tek ZIP
            </p>
          </div>

          {/* Renk + Getir */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
              <ColorPicker value={gunColor} onChange={setGunColor} />
            </div>
            <button
              onClick={fetchGunToday}
              disabled={gunFetch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {gunFetch ? "Getiriliyor…" : "📅 Günün Menüsünü Getir"}
            </button>
          </div>

          {/* Manuel slot (henüz tam değilse) */}
          {!gunComplete && (
            <div>
              <div className="text-sm font-semibold text-warm-700 mb-3">Yemekler</div>
              <FourSlotSelector
                recipes={recipes}
                slots={gunSlots}
                onChange={(key, r) => setGunSlots(prev => ({ ...prev, [key]: r }))}
              />
            </div>
          )}

          {/* Seçili özet */}
          {gunComplete && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-1.5">
              {([["🥣", gunSlots.soup], ["🥘", gunSlots.main], ["🥗", gunSlots.side], ["🍮", gunSlots.dessert]] as [string, SimpleRecipe | null][]).map(([emoji, r]) =>
                r ? (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-warm-800">
                    <span>{emoji}</span>
                    <span className="font-medium">{r.title}</span>
                  </div>
                ) : null
              )}
              <button
                onClick={() => setGunSlots({ soup: null, main: null, side: null, dessert: null })}
                className="text-xs text-warm-400 hover:text-warm-600 mt-1"
              >
                Değiştir
              </button>
            </div>
          )}

          {/* Story preview row */}
          {gunComplete && (
            <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl border border-warm-100">
              <span className="text-xl shrink-0">📱</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-warm-700">Story</div>
                <div className="text-xs text-warm-400">
                  {isMobile ? "Ayrıca paylaşabilirsin" : "ZIP'e dahil"}
                </div>
              </div>
              <button
                onClick={() => window.open(`/api/admin-gorsel?mode=story&${slotParams(gunSlots)}&color=${encodeURIComponent(gunColor)}`, "_blank")}
                className="text-xs text-brand-600 hover:text-brand-800 underline whitespace-nowrap"
              >
                Önizle →
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Caption</div>
            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 text-xs text-warm-600 whitespace-pre-wrap leading-relaxed mb-3 font-mono">
              {generateGunCaption(gunSlots, gunNot)}
            </div>
            <div>
              <label className="text-xs text-warm-500 mb-1 block">📝 Not (opsiyonel)</label>
              <textarea
                value={gunNot}
                onChange={e => setGunNot(e.target.value)}
                placeholder="Ek not..."
                rows={2}
                className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
                style={{ fontSize: 16 }}
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateGunCaption(gunSlots, gunNot));
                setGunCopied(true);
                setTimeout(() => setGunCopied(false), 2000);
              }}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warm-100 text-warm-700 hover:bg-warm-200 transition-colors"
            >
              {gunCopied ? "✅ Kopyalandı!" : "📋 Caption'ı Kopyala"}
            </button>
          </div>

          {/* ── Action buttons ── */}
          {isMobile ? (
            <div className="space-y-3">
              {/* Posts: platform picker */}
              <div ref={gunMenuRef} className="relative">
                <button
                  onClick={() => gunComplete && !gunLoading && setShowGunMenu(v => !v)}
                  disabled={!gunComplete || gunLoading}
                  className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                >
                  {gunLoading
                    ? <><SpinnerIcon /> Hazırlanıyor…</>
                    : <>📤 Post Paylaş <ChevronIcon open={showGunMenu} /></>}
                </button>
                {showGunMenu && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-warm-200 shadow-xl overflow-hidden z-20">
                    {gunPrefetching ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-warm-50">
                        <svg className="w-3 h-3 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" strokeOpacity={0.3}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                        <span className="text-[10px] text-warm-500">Görseller hazırlanıyor…</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-brand-50 border-b border-brand-100 text-[10px] text-brand-600">
                        📋 Caption otomatik kopyalanır.
                      </div>
                    )}
                    <button onClick={() => handleGunMobileShare("instagram")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base">📷</span>
                      <div>
                        <div className="text-xs font-semibold text-warm-800">Instagram</div>
                        <div className="text-[10px] text-warm-400">5 görsel · Paylaşırken dikey seç</div>
                      </div>
                    </button>
                    <div className="h-px bg-warm-100 mx-3" />
                    <button onClick={() => handleGunMobileShare("tiktok")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base">🎵</span>
                      <div className="text-xs font-semibold text-warm-800">TikTok</div>
                    </button>
                    <div className="h-px bg-warm-100 mx-3" />
                    <button onClick={() => handleGunMobileShare("x")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base font-bold text-warm-800">𝕏</span>
                      <div>
                        <div className="text-xs font-semibold text-warm-800">X (Twitter)</div>
                        <div className="text-[10px] text-warm-400">Kısa caption kullanılır</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              {/* Story: direkt share */}
              <button
                onClick={handleGunStoryMobile}
                disabled={!gunComplete}
                className="w-full bg-warm-800 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-warm-900 transition-colors"
              >
                📱 Story Paylaş
              </button>
            </div>
          ) : (
            /* WEB */
            <div className="space-y-3">
              <button
                onClick={downloadGunZip}
                disabled={!gunComplete || gunLoading}
                className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
              >
                {gunLoading
                  ? "İndiriliyor… (8 dosya)"
                  : !gunComplete
                  ? "Önce menüyü getirin"
                  : "📦 ZIP İndir (2 kapak + 4 post + 1 story + caption)"}
              </button>
              {gunComplete && (
                <button
                  onClick={() => window.open(`/api/admin-gorsel?mode=cover-yazili&${slotParams(gunSlots)}&color=${encodeURIComponent(gunColor)}`, "_blank")}
                  className="w-full text-sm text-brand-600 hover:text-brand-800 underline text-center"
                >
                  Kapağı önizle →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PAKET POST TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === "paket" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-warm-900">Paket Post</h2>
            <p className="text-sm text-warm-400 mt-1">
              Maks. 10 tarif seç · opsiyonel kapak ve story · ZIP veya paylaş
            </p>
          </div>

          {/* Renk */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
            <ColorPicker value={paketColor} onChange={setPaketColor} />
          </div>

          {/* Başlık */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-1">Başlık</div>
            <p className="text-xs text-warm-400 mb-2">Kapak, post ve story başlığına uygulanır. Boş bırakılırsa otomatik.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-warm-500 mb-1 block">Başlık metni</label>
                <input
                  type="text"
                  value={paketBaslik}
                  onChange={e => setPaketBaslik(e.target.value)}
                  placeholder="Günün Menüsü"
                  className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className="text-xs text-warm-500 mb-1 block">Alt metin / tarih</label>
                <input
                  type="text"
                  value={paketAltMetin}
                  onChange={e => setPaketAltMetin(e.target.value)}
                  placeholder="29 Nisan 2026"
                  className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  style={{ fontSize: 16 }}
                />
              </div>
            </div>
          </div>

          {/* İçerik modu */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">İçerik (Post)</div>
            <div className="flex flex-wrap gap-2">
              {(["both", "ingredients", "steps", "none"] as ContentMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaketContentMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    paketContentMode === m
                      ? "bg-brand-600 text-white"
                      : "bg-warm-50 text-warm-600 hover:bg-warm-100 border border-warm-200"
                  }`}
                >
                  {m === "both" ? "Malzeme + Yapılış" : m === "ingredients" ? "Malzeme" : m === "steps" ? "Yapılış" : "Hiçbiri"}
                </button>
              ))}
            </div>
          </div>

          {/* Tarif seçimi */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="text-sm font-semibold text-warm-700">
                Tarifler
                <span className="ml-1 text-warm-400 font-normal">({paketRecipes.length}/10)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPaketToday}
                  disabled={paketMenuFetch}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 transition-colors"
                >
                  {paketMenuFetch ? "Getiriliyor…" : "📅 Günün Menüsü"}
                </button>
                {paketRecipes.length > 0 && (
                  <button onClick={() => setPaketRecipes([])} className="text-xs text-warm-400 hover:text-warm-700">
                    Temizle
                  </button>
                )}
              </div>
            </div>

            {/* Chips */}
            {paketRecipes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {paketRecipes.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 text-sm">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CAT_COLORS[r.category] ?? ""}`}>
                      {SLOT_LABELS[r.category as keyof SlotState] ?? r.category}
                    </span>
                    <span className="text-warm-800 truncate max-w-[110px]">{r.title}</span>
                    <button onClick={() => togglePaket(r)} className="text-warm-400 hover:text-warm-700 text-base leading-none">×</button>
                  </div>
                ))}
              </div>
            )}

            {paketRecipes.length < 10 && (
              <>
                <input
                  type="text"
                  value={paketSearch}
                  onChange={(e) => setPaketSearch(e.target.value)}
                  placeholder="Tarif ara ve ekle..."
                  className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 mb-2"
                  style={{ fontSize: 16 }}
                />
                <div className="border border-warm-100 rounded-lg max-h-52 overflow-y-auto">
                  {filteredForPaket.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-warm-400 text-center">Tarif bulunamadı</div>
                  ) : (
                    filteredForPaket.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => togglePaket(r)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-warm-50 text-sm border-b border-warm-50 last:border-b-0"
                      >
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CAT_COLORS[r.category] ?? ""}`}>
                          {SLOT_LABELS[r.category as keyof SlotState] ?? r.category}
                        </span>
                        <span className="truncate text-warm-800">{r.title}</span>
                        <span className="ml-auto text-brand-500 text-lg leading-none flex-shrink-0">+</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Kapak seçeneği ── */}
          <div className="border border-warm-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setPaketKapakEkle(v => !v)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-warm-50 transition-colors"
            >
              {/* Toggle */}
              <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${paketKapakEkle ? "bg-brand-600" : "bg-warm-200"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${paketKapakEkle ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-warm-800">🖼️ Kapak ekle</div>
                <div className="text-xs text-warm-400">10 tariften 4'ünü kapak için seç</div>
              </div>
            </button>

            {paketKapakEkle && (
              <div className="px-4 pb-4 space-y-4 border-t border-warm-100">
                {/* Yazılı / Yazısız */}
                <div className="pt-3">
                  <div className="text-xs font-semibold text-warm-600 mb-2">Kapak Türü</div>
                  <div className="flex gap-2 flex-wrap">
                    {(["yazili", "yazisiz"] as CoverType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPaketKapakType(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          paketKapakType === t ? "bg-brand-600 text-white" : "bg-warm-50 text-warm-600 hover:bg-warm-100 border border-warm-200"
                        }`}
                      >
                        {t === "yazili" ? "Yazılı" : "Yazısız (sade kolaj)"}
                      </button>
                    ))}
                  </div>
                </div>

                {paketRecipes.length >= 4 ? (
                  <div>
                    <div className="text-xs font-semibold text-warm-600 mb-2">Kapakta yer alacak 4 tarif</div>
                    <PaketSlotSelector
                      available={paketRecipes}
                      slots={paketKapakSlots}
                      onChange={(key, r) => setPaketKapakSlots(prev => ({ ...prev, [key]: r }))}
                    />
                    {slotsComplete(paketKapakSlots) && (
                      <button
                        onClick={() => window.open(buildPaketKapakUrl(), "_blank")}
                        className="mt-2 text-xs text-brand-600 hover:text-brand-800 underline"
                      >
                        Kapağı önizle →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-warm-400 bg-warm-50 rounded-lg px-3 py-2">
                    En az 4 tarif seçmelisiniz.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Story seçeneği ── */}
          <div className="border border-warm-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setPaketStoryEkle(v => !v)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-warm-50 transition-colors"
            >
              <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${paketStoryEkle ? "bg-brand-600" : "bg-warm-200"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${paketStoryEkle ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-warm-800">📱 Story ekle</div>
                <div className="text-xs text-warm-400">10 tariften 4'ünü story için seç · Mobilde ayrıca paylaşılabilir</div>
              </div>
            </button>

            {paketStoryEkle && (
              <div className="px-4 pb-4 space-y-4 border-t border-warm-100 pt-3">
                {paketRecipes.length >= 4 ? (
                  <div>
                    <div className="text-xs font-semibold text-warm-600 mb-2">Story&apos;de yer alacak 4 tarif</div>
                    <PaketSlotSelector
                      available={paketRecipes}
                      slots={paketStorySlots}
                      onChange={(key, r) => setPaketStorySlots(prev => ({ ...prev, [key]: r }))}
                    />
                    {slotsComplete(paketStorySlots) && (
                      <button
                        onClick={() => window.open(`/api/admin-gorsel?mode=story&color=${encodeURIComponent(paketColor)}&${slotParams(paketStorySlots)}`, "_blank")}
                        className="mt-2 text-xs text-brand-600 hover:text-brand-800 underline"
                      >
                        Story&apos;yi önizle →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-warm-400 bg-warm-50 rounded-lg px-3 py-2">
                    En az 4 tarif seçmelisiniz.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Caption</div>
            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 text-xs text-warm-600 whitespace-pre-wrap leading-relaxed mb-3 font-mono">
              {generatePaketCaption(paketRecipes, paketNot)}
            </div>
            <div>
              <label className="text-xs text-warm-500 mb-1 block">📝 Not (opsiyonel)</label>
              <textarea
                value={paketNot}
                onChange={e => setPaketNot(e.target.value)}
                placeholder="Ek not..."
                rows={2}
                className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
                style={{ fontSize: 16 }}
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatePaketCaption(paketRecipes, paketNot));
                setPaketCopied(true);
                setTimeout(() => setPaketCopied(false), 2000);
              }}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warm-100 text-warm-700 hover:bg-warm-200 transition-colors"
            >
              {paketCopied ? "✅ Kopyalandı!" : "📋 Caption'ı Kopyala"}
            </button>
          </div>

          {/* ── Action buttons ── */}
          {isMobile ? (
            <div className="space-y-3">
              {/* Post platform picker */}
              <div ref={paketMenuRef} className="relative">
                <button
                  onClick={() => paketComplete && !paketLoading && setShowPaketMenu(v => !v)}
                  disabled={!paketComplete || paketLoading}
                  className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                >
                  {paketLoading
                    ? <><SpinnerIcon /> Hazırlanıyor…</>
                    : <>📤 Post Paylaş <ChevronIcon open={showPaketMenu} /></>}
                </button>
                {showPaketMenu && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-warm-200 shadow-xl overflow-hidden z-20">
                    {paketPrefetching ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-warm-50">
                        <svg className="w-3 h-3 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" strokeOpacity={0.3}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                        <span className="text-[10px] text-warm-500">Görseller hazırlanıyor…</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-brand-50 border-b border-brand-100 text-[10px] text-brand-600">
                        📋 Caption otomatik kopyalanır.
                      </div>
                    )}
                    <button onClick={() => handlePaketMobileShare("instagram")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base">📷</span>
                      <div className="text-xs font-semibold text-warm-800">Instagram</div>
                    </button>
                    <div className="h-px bg-warm-100 mx-3" />
                    <button onClick={() => handlePaketMobileShare("tiktok")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base">🎵</span>
                      <div className="text-xs font-semibold text-warm-800">TikTok</div>
                    </button>
                    <div className="h-px bg-warm-100 mx-3" />
                    <button onClick={() => handlePaketMobileShare("x")} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                      <span className="text-base font-bold text-warm-800">𝕏</span>
                      <div className="text-xs font-semibold text-warm-800">X (Twitter)</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Story: ayrı paylaş (sadece story ekle aktifse ve tamamsa) */}
              {paketStoryEkle && slotsComplete(paketStorySlots) && (
                <div ref={paketStoryMenuRef} className="relative">
                  <button
                    onClick={() => setShowPaketStoryMenu(v => !v)}
                    className="w-full bg-warm-800 text-white rounded-xl py-3 font-semibold text-sm hover:bg-warm-900 transition-colors flex items-center justify-center gap-2"
                  >
                    📱 Story Paylaş <ChevronIcon open={showPaketStoryMenu} />
                  </button>
                  {showPaketStoryMenu && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-warm-200 shadow-xl overflow-hidden z-20">
                      <button onClick={handlePaketStoryMobile} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-50 text-left">
                        <span className="text-base">📷</span>
                        <div className="text-xs font-semibold text-warm-800">Instagram / TikTok</div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* WEB */
            <div className="space-y-3">
              <button
                onClick={downloadPaketZip}
                disabled={!paketComplete || paketLoading}
                className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
              >
                {paketLoading
                  ? "İndiriliyor…"
                  : !paketComplete
                  ? "En az 1 tarif seçiniz"
                  : `📦 ZIP İndir (${paketRecipes.length} post${paketKapakEkle && slotsComplete(paketKapakSlots) ? " + kapak" : ""}${paketStoryEkle && slotsComplete(paketStorySlots) ? " + story" : ""} + caption)`}
              </button>
              {paketComplete && (
                <button
                  onClick={() => window.open(buildPaketPostUrl(paketRecipes[0].id), "_blank")}
                  className="w-full text-sm text-brand-600 hover:text-brand-800 underline text-center"
                >
                  İlk postu önizle →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
