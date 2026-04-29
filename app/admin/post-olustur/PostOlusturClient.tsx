"use client";

import { useState, useMemo } from "react";
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
type Section     = "post" | "kapak" | "story" | "gunmenu";

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

/* ── Helper: safe filename ──────────────────────────────────── */
function safeFilename(title: string, suffix?: string): string {
  const base = title.replace(/[^a-z0-9çğıöşüÇĞİÖŞÜ\s]/gi, "").replace(/\s+/g, "_").slice(0, 40);
  return suffix ? `${base}_${suffix}.png` : `${base}.png`;
}

/* ── Sub-component: Color Picker ────────────────────────────── */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={COLOR_LABELS[c]}
          className={`w-9 h-9 rounded-full border-2 transition-transform ${
            value === c ? "border-warm-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <span className="self-center text-xs text-warm-400 ml-1">{COLOR_LABELS[value] ?? value}</span>
    </div>
  );
}

/* ── Sub-component: Recipe Search Input ─────────────────────── */
function RecipeSearchInput({
  recipes,
  value,
  onChange,
  label,
  excludeIds,
}: {
  recipes: SimpleRecipe[];
  value: SimpleRecipe | null;
  onChange: (r: SimpleRecipe | null) => void;
  label: string;
  excludeIds?: string[];
}) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return recipes.filter(r => !excludeIds?.includes(r.id)).slice(0, 20);
    const q = query.toLowerCase();
    return recipes
      .filter(r => !excludeIds?.includes(r.id) && r.title.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, recipes, excludeIds]);

  function selectRecipe(r: SimpleRecipe) {
    onChange(r);
    setQuery("");
    setOpen(false);
  }

  function clearRecipe() {
    onChange(null);
    setQuery("");
  }

  return (
    <div className="relative">
      <div className="text-xs font-semibold text-warm-600 mb-1">{label}</div>

      {value ? (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CAT_COLORS[value.category] ?? "bg-gray-100 text-gray-600"}`}>
            {SLOT_LABELS[value.category as keyof SlotState] ?? value.category}
          </span>
          <span className="flex-1 text-sm text-warm-800 truncate">{value.title}</span>
          <button
            onClick={clearRecipe}
            className="text-warm-400 hover:text-warm-700 text-lg leading-none"
          >
            ×
          </button>
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

/* ── Sub-component: 4-Slot Selector ─────────────────────────── */
function FourSlotSelector({
  recipes,
  slots,
  onChange,
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

/* ── Main component ─────────────────────────────────────────── */
export default function PostOlusturClient({ recipes }: Props) {
  const [activeSection, setActiveSection] = useState<Section>("post");

  /* ── Post state ── */
  const [postColor,   setPostColor]   = useState<string>("#92400E");
  const [contentMode, setContentMode] = useState<ContentMode>("both");
  const [postBaslik,  setPostBaslik]  = useState("");
  const [postAltMetin, setPostAltMetin] = useState("");
  const [postSearch,  setPostSearch]  = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<SimpleRecipe[]>([]);
  const [postLoading,    setPostLoading]    = useState(false);
  const [postMenuFetch,  setPostMenuFetch]  = useState(false);

  /* ── Kapak state ── */
  const [kapakType,         setKapakType]         = useState<CoverType>("yazili");
  const [kapakColor,        setKapakColor]        = useState<string>("#92400E");
  const [kapakYazisizColor, setKapakYazisizColor] = useState<string>("#92400E");
  const [kapakBaslik,       setKapakBaslik]       = useState("");
  const [kapakTarih,        setKapakTarih]        = useState("");
  const [kapakSlots,        setKapakSlots]        = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  const [kapakLoading,      setKapakLoading]      = useState(false);
  const [kapakMenuFetch,    setKapakMenuFetch]    = useState(false);

  /* ── Story state ── */
  const [storyColor,      setStoryColor]      = useState<string>("#92400E");
  const [storySlots,      setStorySlots]      = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  const [storyLoading,    setStoryLoading]    = useState(false);
  const [storyMenuFetch,  setStoryMenuFetch]  = useState(false);

  /* ── Günün Menüsü (all-in-one) state ── */
  const [gunColor,    setGunColor]    = useState<string>("#92400E");
  const [gunSlots,    setGunSlots]    = useState<SlotState>({ soup: null, main: null, side: null, dessert: null });
  const [gunNot,      setGunNot]      = useState("");
  const [gunLoading,  setGunLoading]  = useState(false);
  const [gunFetch,    setGunFetch]    = useState(false);
  const [gunCopied,   setGunCopied]   = useState(false);

  /* ── Post: filtered recipe list ── */
  const selectedIds = selectedRecipes.map(r => r.id);
  const filteredForPost = useMemo(() => {
    if (!postSearch.trim()) return recipes.filter(r => !selectedIds.includes(r.id)).slice(0, 30);
    const q = postSearch.toLowerCase();
    return recipes.filter(r => !selectedIds.includes(r.id) && r.title.toLowerCase().includes(q)).slice(0, 30);
  }, [postSearch, recipes, selectedIds]);

  function toggleRecipe(r: SimpleRecipe) {
    if (selectedIds.includes(r.id)) {
      setSelectedRecipes(prev => prev.filter(x => x.id !== r.id));
    } else if (selectedRecipes.length < 10) {
      setSelectedRecipes(prev => [...prev, r]);
    }
  }

  /* ── Post: build URL helper ── */
  function buildPostUrl(recipeId: string) {
    let url = `/api/admin-gorsel?mode=post&recipeId=${recipeId}&color=${encodeURIComponent(postColor)}&content=${contentMode}`;
    if (postBaslik)   url += `&headerTitle=${encodeURIComponent(postBaslik)}`;
    if (postAltMetin) url += `&headerDate=${encodeURIComponent(postAltMetin)}`;
    return url;
  }

  /* ── Post: ZIP download ── */
  async function downloadPostZip() {
    if (selectedRecipes.length === 0) return;
    setPostLoading(true);
    try {
      const files: Record<string, Uint8Array> = {};
      for (const recipe of selectedRecipes) {
        const url = buildPostUrl(recipe.id);
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const buf = await resp.arrayBuffer();
        files[safeFilename(recipe.title)] = new Uint8Array(buf);
      }
      if (Object.keys(files).length === 0) return;
      const zip = zipSync(files);
      const blob = new Blob([zip as unknown as BlobPart], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "admin-postlar.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setPostLoading(false);
    }
  }

  /* ── Kapak: slots complete? ── */
  function slotsComplete(slots: SlotState): boolean {
    return !!(slots.soup && slots.main && slots.side && slots.dessert);
  }

  function slotParams(slots: SlotState): string {
    return `soup=${slots.soup!.id}&main=${slots.main!.id}&side=${slots.side!.id}&dessert=${slots.dessert!.id}`;
  }

  /* ── Kapak URL helper ── */
  function buildKapakUrl() {
    const mode = kapakType === "yazili" ? "cover-yazili" : "cover-yazisiz";
    let url = `/api/admin-gorsel?mode=${mode}&${slotParams(kapakSlots)}`;
    if (kapakType === "yazili") {
      url += `&color=${encodeURIComponent(kapakColor)}`;
      if (kapakBaslik) url += `&headerTitle=${encodeURIComponent(kapakBaslik)}`;
      if (kapakTarih)  url += `&headerDate=${encodeURIComponent(kapakTarih)}`;
    } else {
      url += `&color=${encodeURIComponent(kapakYazisizColor)}`;
    }
    return url;
  }

  /* ── Kapak: download ── */
  async function downloadKapak() {
    if (!slotsComplete(kapakSlots)) return;
    setKapakLoading(true);
    try {
      const url = buildKapakUrl();
      const resp = await fetch(buildKapakUrl());
      if (!resp.ok) return;
      const buf = await resp.arrayBuffer();
      const blob = new Blob([new Uint8Array(buf)], { type: "image/png" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `kapak-${kapakType}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setKapakLoading(false);
    }
  }

  /* ── Story: download ── */
  async function downloadStory() {
    if (!slotsComplete(storySlots)) return;
    setStoryLoading(true);
    try {
      const url = `/api/admin-gorsel?mode=story&color=${encodeURIComponent(storyColor)}&${slotParams(storySlots)}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const buf = await resp.arrayBuffer();
      const blob = new Blob([new Uint8Array(buf)], { type: "image/png" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "story.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setStoryLoading(false);
    }
  }

  /* ── Slot onChange helpers ── */
  function updateKapakSlot(key: keyof SlotState, r: SimpleRecipe | null) {
    setKapakSlots(prev => ({ ...prev, [key]: r }));
  }
  function updateStorySlot(key: keyof SlotState, r: SimpleRecipe | null) {
    setStorySlots(prev => ({ ...prev, [key]: r }));
  }

  /* ── Günün menüsünü getir ── */
  async function fetchTodaysMenu(
    setSlots: (s: SlotState) => void,
    setLoading: (v: boolean) => void,
  ) {
    setLoading(true);
    try {
      const res = await fetch("/api/menu/today");
      if (!res.ok) { alert("Bugün için yayınlanmış menü bulunamadı."); return; }
      const { menu } = await res.json();
      const toSimple = (r: { id: string; title: string; category: string } | null) =>
        r ? { id: r.id, title: r.title, category: r.category } : null;
      setSlots({
        soup:    toSimple(menu.soup),
        main:    toSimple(menu.main),
        side:    toSimple(menu.side),
        dessert: toSimple(menu.dessert),
      });
    } catch {
      alert("Menü getirilemedi, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Günün Menüsü: caption ── */
  function generateGunCaption(slots: SlotState, not: string): string {
    const today = new Date().toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "numeric", month: "long", weekday: "long",
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

  /* ── Günün Menüsü: ZIP download ── */
  async function downloadGunZip() {
    if (!slotsComplete(gunSlots)) return;
    setGunLoading(true);
    try {
      const files: Record<string, Uint8Array> = {};
      const sp = slotParams(gunSlots);
      const col = encodeURIComponent(gunColor);

      // 1. Yazılı kapak
      const kapakResp = await fetch(`/api/admin-gorsel?mode=cover-yazili&${sp}&color=${col}`);
      if (kapakResp.ok) files["kapak-yazili.png"] = new Uint8Array(await kapakResp.arrayBuffer());

      // 2. Yazısız kapak
      const yazisizResp = await fetch(`/api/admin-gorsel?mode=cover-yazisiz&${sp}&color=${col}`);
      if (yazisizResp.ok) files["kapak-yazisiz.png"] = new Uint8Array(await yazisizResp.arrayBuffer());

      // 3. 4 recipe posts
      const slotEntries: [string, SimpleRecipe | null][] = [
        ["corba",           gunSlots.soup],
        ["ana-yemek",       gunSlots.main],
        ["yardimci-lezzet", gunSlots.side],
        ["tatli",           gunSlots.dessert],
      ];
      for (const [label, recipe] of slotEntries) {
        if (!recipe) continue;
        const postResp = await fetch(`/api/admin-gorsel?mode=post&recipeId=${recipe.id}&color=${col}&content=both`);
        if (postResp.ok) files[`post-${label}.png`] = new Uint8Array(await postResp.arrayBuffer());
      }

      // 3. Caption
      const caption = generateGunCaption(gunSlots, gunNot);
      files["caption.txt"] = new TextEncoder().encode(caption);

      if (Object.keys(files).length === 0) return;
      const zip = zipSync(files);
      const blob = new Blob([zip as unknown as BlobPart], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "gunun-menusu.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setGunLoading(false);
    }
  }

  /* ── Section tab button ── */
  const TabBtn = ({ s, label }: { s: Section; label: string }) => (
    <button
      onClick={() => setActiveSection(s)}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
        activeSection === s
          ? "bg-brand-600 text-white"
          : "bg-white border border-warm-200 text-warm-600 hover:border-brand-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabBtn s="post"    label="📸 Post" />
        <TabBtn s="kapak"   label="🖼️ Kapak" />
        <TabBtn s="story"   label="📱 Story" />
        <TabBtn s="gunmenu" label="🍽️ Günün Menüsü" />
      </div>

      {/* ── POST ── */}
      {activeSection === "post" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-warm-900">Post Oluştur</h2>
          <p className="text-sm text-warm-400 -mt-4">
            Her tarif için ayrı bir slide görseli oluşturulur ve ZIP olarak indirilir.
          </p>

          {/* Color picker */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
            <ColorPicker value={postColor} onChange={setPostColor} />
          </div>

          {/* Header başlık */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-1">Başlık (Header)</div>
            <p className="text-xs text-warm-400 mb-2">
              Boş bırakılırsa "Günün Menüsü" + bugünün tarihi kullanılır.
              Sadece birini doldurursan diğeri ortalı gelir.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-warm-500 mb-1 block">Başlık metni</label>
                <input
                  type="text"
                  value={postBaslik}
                  onChange={e => setPostBaslik(e.target.value)}
                  placeholder="Günün Menüsü"
                  className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  style={{ fontSize: 16 }}
                />
              </div>
              <div>
                <label className="text-xs text-warm-500 mb-1 block">Alt metin / tarih</label>
                <input
                  type="text"
                  value={postAltMetin}
                  onChange={e => setPostAltMetin(e.target.value)}
                  placeholder="29 Nisan 2026 Çarşamba"
                  className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  style={{ fontSize: 16 }}
                />
              </div>
            </div>
          </div>

          {/* Content toggle */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">İçerik</div>
            <div className="flex gap-2">
              {(["both", "ingredients", "steps", "none"] as ContentMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setContentMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    contentMode === m
                      ? "bg-brand-600 text-white"
                      : "bg-warm-50 text-warm-600 hover:bg-warm-100 border border-warm-200"
                  }`}
                >
                  {m === "both" ? "Malzeme + Yapılış" : m === "ingredients" ? "Malzeme" : m === "steps" ? "Yapılış" : "Hiçbiri"}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe multi-select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-warm-700">
                Tarifler
                <span className="ml-1 text-warm-400 font-normal">({selectedRecipes.length}/10)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setPostMenuFetch(true);
                    try {
                      const res = await fetch("/api/menu/today");
                      if (!res.ok) { alert("Bugün için yayınlanmış menü bulunamadı."); return; }
                      const { menu } = await res.json();
                      const slots = [menu.soup, menu.main, menu.side, menu.dessert];
                      const toAdd: SimpleRecipe[] = slots
                        .filter(Boolean)
                        .map((r: { id: string; title: string; category: string }) => ({ id: r.id, title: r.title, category: r.category }));
                      setSelectedRecipes(toAdd);
                    } catch { alert("Menü getirilemedi."); }
                    finally { setPostMenuFetch(false); }
                  }}
                  disabled={postMenuFetch}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 transition-colors"
                >
                  {postMenuFetch ? "Getiriliyor…" : "📅 Günün Menüsü"}
                </button>
                {selectedRecipes.length > 0 && (
                  <button onClick={() => setSelectedRecipes([])} className="text-xs text-warm-400 hover:text-warm-700">
                    Temizle
                  </button>
                )}
              </div>
            </div>

            {/* Selected chips */}
            {selectedRecipes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRecipes.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 text-sm"
                  >
                    <span className="text-warm-800 truncate max-w-[140px]">{r.title}</span>
                    <button
                      onClick={() => toggleRecipe(r)}
                      className="text-warm-400 hover:text-warm-700 text-base leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            {selectedRecipes.length < 10 && (
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Tarif ara ve ekle..."
                className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 mb-2"
                style={{ fontSize: 16 }}
              />
            )}

            {/* Recipe list */}
            {selectedRecipes.length < 10 && (
              <div className="border border-warm-100 rounded-lg max-h-52 overflow-y-auto">
                {filteredForPost.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-warm-400 text-center">Tarif bulunamadı</div>
                ) : (
                  filteredForPost.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => toggleRecipe(r)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-warm-50 text-sm border-b border-warm-50 last:border-b-0"
                    >
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CAT_COLORS[r.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {SLOT_LABELS[r.category as keyof SlotState] ?? r.category}
                      </span>
                      <span className="truncate text-warm-800">{r.title}</span>
                      <span className="ml-auto text-brand-500 text-lg leading-none flex-shrink-0">+</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Download */}
          <button
            onClick={downloadPostZip}
            disabled={selectedRecipes.length === 0 || postLoading}
            className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
          >
            {postLoading
              ? `İndiriliyor... (${selectedRecipes.length} görsel)`
              : selectedRecipes.length === 0
              ? "Tarif seçiniz"
              : `ZIP İndir (${selectedRecipes.length} görsel)`}
          </button>

          {/* Preview link */}
          {selectedRecipes.length > 0 && (
            <button
              onClick={() => window.open(buildPostUrl(selectedRecipes[0].id), "_blank")}
              className="w-full text-sm text-brand-600 hover:text-brand-800 underline text-center"
            >
              İlk tarifi önizle →
            </button>
          )}
        </div>
      )}

      {/* ── KAPAK ── */}
      {activeSection === "kapak" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-warm-900">Kapak Oluştur</h2>

          {/* Yazılı / Yazısız toggle */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Tür</div>
            <div className="flex gap-2">
              {(["yazili", "yazisiz"] as CoverType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setKapakType(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    kapakType === t
                      ? "bg-brand-600 text-white"
                      : "bg-warm-50 text-warm-600 hover:bg-warm-100 border border-warm-200"
                  }`}
                >
                  {t === "yazili" ? "Yazılı (başlık + footer)" : "Yazısız (sade kolaj)"}
                </button>
              ))}
            </div>
          </div>

          {/* Yazısız-only: renk */}
          {kapakType === "yazisiz" && (
            <div>
              <div className="text-sm font-semibold text-warm-700 mb-2">Grid Rengi</div>
              <ColorPicker value={kapakYazisizColor} onChange={setKapakYazisizColor} />
            </div>
          )}

          {/* Yazılı-only: renk + özel başlık/tarih */}
          {kapakType === "yazili" && (
            <>
              <div>
                <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
                <ColorPicker value={kapakColor} onChange={setKapakColor} />
              </div>

              <div>
                <div className="text-sm font-semibold text-warm-700 mb-1">Başlık</div>
                <p className="text-xs text-warm-400 mb-2">
                  Boş bırakılırsa "Günün Menüsü" + bugünün tarihi kullanılır.
                  Sadece birini doldurursan diğeri ortalı gelir.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-warm-500 mb-1 block">Başlık metni</label>
                    <input
                      type="text"
                      value={kapakBaslik}
                      onChange={e => setKapakBaslik(e.target.value)}
                      placeholder="Günün Menüsü"
                      className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      style={{ fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-warm-500 mb-1 block">Tarih / alt metin</label>
                    <input
                      type="text"
                      value={kapakTarih}
                      onChange={e => setKapakTarih(e.target.value)}
                      placeholder="29 Nisan 2026 Çarşamba"
                      className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      style={{ fontSize: 16 }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4-slot selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-warm-700">Yemekler</div>
              <button
                onClick={() => fetchTodaysMenu(setKapakSlots, setKapakMenuFetch)}
                disabled={kapakMenuFetch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 transition-colors"
              >
                {kapakMenuFetch ? "Getiriliyor…" : "📅 Günün Menüsünü Getir"}
              </button>
            </div>
            <FourSlotSelector recipes={recipes} slots={kapakSlots} onChange={updateKapakSlot} />
          </div>

          {/* Download */}
          <button
            onClick={downloadKapak}
            disabled={!slotsComplete(kapakSlots) || kapakLoading}
            className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
          >
            {kapakLoading ? "İndiriliyor..." : !slotsComplete(kapakSlots) ? "4 yemek seçiniz" : "Kapak İndir"}
          </button>

          {/* Preview */}
          {slotsComplete(kapakSlots) && (
            <button
              onClick={() => window.open(buildKapakUrl(), "_blank")}
              className="w-full text-sm text-brand-600 hover:text-brand-800 underline text-center"
            >
              Önizle →
            </button>
          )}
        </div>
      )}

      {/* ── STORY ── */}
      {activeSection === "story" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold text-warm-900">Story Oluştur</h2>
          <p className="text-sm text-warm-400 -mt-4">
            1080 × 1920 Instagram story formatı
          </p>

          {/* Renk */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
            <ColorPicker value={storyColor} onChange={setStoryColor} />
          </div>

          {/* 4-slot selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-warm-700">Yemekler</div>
              <button
                onClick={() => fetchTodaysMenu(setStorySlots, setStoryMenuFetch)}
                disabled={storyMenuFetch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 transition-colors"
              >
                {storyMenuFetch ? "Getiriliyor…" : "📅 Günün Menüsünü Getir"}
              </button>
            </div>
            <FourSlotSelector recipes={recipes} slots={storySlots} onChange={updateStorySlot} />
          </div>

          {/* Download */}
          <button
            onClick={downloadStory}
            disabled={!slotsComplete(storySlots) || storyLoading}
            className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
          >
            {storyLoading ? "İndiriliyor..." : !slotsComplete(storySlots) ? "4 yemek seçiniz" : "Story İndir"}
          </button>

          {/* Preview */}
          {slotsComplete(storySlots) && (
            <button
              onClick={() => window.open(`/api/admin-gorsel?mode=story&color=${encodeURIComponent(storyColor)}&${slotParams(storySlots)}`, "_blank")}
              className="w-full text-sm text-brand-600 hover:text-brand-800 underline text-center"
            >
              Önizle →
            </button>
          )}
        </div>
      )}

      {/* ── GÜNÜN MENÜSÜ (all-in-one) ── */}
      {activeSection === "gunmenu" && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-warm-900">Günün Menüsü Paketi</h2>
            <p className="text-sm text-warm-400 mt-1">
              1 yazılı kapak + 4 tarif postu + caption.txt → tek ZIP
            </p>
          </div>

          {/* Renk + Günün Menüsünü Getir */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-warm-700 mb-2">Renk Teması</div>
              <ColorPicker value={gunColor} onChange={setGunColor} />
            </div>
            <button
              onClick={() => fetchTodaysMenu(setGunSlots, setGunFetch)}
              disabled={gunFetch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {gunFetch ? "Getiriliyor…" : "📅 Günün Menüsünü Getir"}
            </button>
          </div>

          {/* Seçili yemekler özeti */}
          {slotsComplete(gunSlots) && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-1.5">
              {([["🥣", gunSlots.soup], ["🥘", gunSlots.main], ["🥗", gunSlots.side], ["🍮", gunSlots.dessert]] as [string, SimpleRecipe | null][]).map(([emoji, r]) =>
                r ? (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-warm-800">
                    <span>{emoji}</span>
                    <span className="font-medium">{r.title}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* Manuel düzenleme */}
          {!slotsComplete(gunSlots) && (
            <div>
              <div className="text-sm font-semibold text-warm-700 mb-3">Yemekler</div>
              <FourSlotSelector
                recipes={recipes}
                slots={gunSlots}
                onChange={(key, r) => setGunSlots(prev => ({ ...prev, [key]: r }))}
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <div className="text-sm font-semibold text-warm-700 mb-2">Caption</div>
            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 text-xs text-warm-600 whitespace-pre-wrap leading-relaxed mb-3 font-mono">
              {generateGunCaption(gunSlots, gunNot)}
            </div>
            <div>
              <label className="text-xs text-warm-500 mb-1 block">📝 Not (opsiyonel — caption&#39;a eklenir)</label>
              <textarea
                value={gunNot}
                onChange={e => setGunNot(e.target.value)}
                placeholder="Örn: Bu haftanın özel menüsü, afiyet olsun!"
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

          {/* ZIP İndir */}
          <button
            onClick={downloadGunZip}
            disabled={!slotsComplete(gunSlots) || gunLoading}
            className="w-full bg-brand-600 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 hover:bg-brand-700 transition-colors"
          >
            {gunLoading
              ? "İndiriliyor… (7 dosya)"
              : !slotsComplete(gunSlots)
              ? "Önce menüyü getirin"
              : "📦 ZIP İndir (2 kapak + 4 post + caption)"}
          </button>

          {/* Kapak önizle */}
          {slotsComplete(gunSlots) && (
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
  );
}
