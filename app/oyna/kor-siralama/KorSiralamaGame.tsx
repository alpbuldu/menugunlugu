"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Food { id: string; title: string; slug: string; image_url: string | null }
type Phase = "category" | "loading" | "game" | "result";

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

const CATS = [
  { key: "soup",    label: "Çorba",          emoji: "🥣", bg: "from-[#C4872A] to-[#8B5A18]" },
  { key: "main",    label: "Ana Yemek",       emoji: "🍖", bg: "from-[#B05A38] to-[#7A3A20]" },
  { key: "side",    label: "Yardımcı Lezzet", emoji: "🥗", bg: "from-[#7A9A4A] to-[#4A6A20]" },
  { key: "dessert", label: "Tatlı",           emoji: "🍰", bg: "from-[#9A6A7A] to-[#6A3A4A]" },
] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  soup:    ["Kremalı Çorbalar","Sebze Çorbaları","Et / Tavuk Sulu Çorbalar","Bakliyat Çorbaları","Yoğurtlu Çorbalar","Soğuk Çorbalar","Yöresel Çorbalar","Şehriyeli / Tahıllı Çorbalar"],
  main:    ["Et Yemekleri","Tavuk Yemekleri","Balık / Deniz Ürünleri","Sebze Yemekleri","Bakliyat Yemekleri","Makarna / Noodle","Pilav / Tahıl Yemekleri","Fırın Yemekleri","Tencere Yemekleri","Izgara / Mangal","Sulu Yemekler","Fast Food / Street Food","Dünya Mutfağı Yemekleri"],
  side:    ["Salatalar","Mezeler","Zeytinyağlılar","Garnitürler","Soslar","Turşular","Ekmekler / Hamur İşleri","Kahvaltılık Yan Lezzetler"],
  dessert: ["Şerbetli Tatlılar","Sütlü Tatlılar","Çikolatalı Tatlılar","Fırın Tatlıları","Soğuk Tatlılar","Meyveli Tatlılar","Hamur Tatlıları","Pratik Tatlılar","Dünya Tatlıları"],
};
const LABEL_PLURAL: Record<string, string> = {
  soup: "Çorbalar", main: "Ana Yemekler", side: "Yardımcı Lezzetler", dessert: "Tatlılar",
};
const MIN_RECIPES = 10;

async function addPoints(pts: number) {
  try {
    await fetch("/api/oyun/puan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ points: pts }) });
  } catch { /* ignore */ }
}

export default function KorSiralamaGame() {
  const [phase, setPhase]           = useState<Phase>("category");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subcatCounts, setSubcatCounts] = useState<Record<string, number>>({});
  const [selLabel, setSelLabel]     = useState("");
  const [foods, setFoods]           = useState<Food[]>([]);
  const [slots, setSlots]           = useState<(Food | null)[]>(Array(10).fill(null));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pointsMsg, setPointsMsg]   = useState<string | null>(null);

  const supabase = createClient();

  async function loadSubcatCounts(catKey: string) {
    const { data } = await supabase.from("recipes").select("subcategories")
      .eq("category", catKey).eq("approval_status", "approved").not("image_url", "is", null);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { (r.subcategories ?? []).forEach((sub: string) => { counts[sub] = (counts[sub] ?? 0) + 1; }); });
    setSubcatCounts(counts);
  }

  function toggleCat(key: string) {
    if (expandedCat !== key) loadSubcatCounts(key);
    setExpandedCat(prev => prev === key ? null : key);
  }

  async function pickCat(key: string) {
    setPhase("loading");
    const { data } = await supabase.from("recipes").select("id, title, slug, image_url")
      .eq("category", key).eq("approval_status", "approved").not("image_url", "is", null);
    if (!data || data.length < 10) { setPhase("category"); return; }
    setSelLabel(CATS.find(c => c.key === key)?.label ?? "");
    startGame(shuffle(data as Food[]).slice(0, 10));
  }

  async function pickSubcat(catKey: string, subcat: string) {
    setPhase("loading");
    const { data } = await supabase.from("recipes").select("id, title, slug, image_url")
      .eq("category", catKey).eq("approval_status", "approved").not("image_url", "is", null)
      .contains("subcategories", [subcat]);
    if (!data || data.length < 10) { setPhase("category"); return; }
    setSelLabel(subcat);
    startGame(shuffle(data as Food[]).slice(0, 10));
  }

  function startGame(picked: Food[]) {
    setFoods(picked);
    setSlots(Array(10).fill(null));
    setCurrentIdx(0);
    setPointsMsg(null);
    setPhase("game");
  }

  function placeAt(slotIdx: number) {
    if (slots[slotIdx] !== null) return;
    const newSlots = [...slots];
    newSlots[slotIdx] = foods[currentIdx];
    setSlots(newSlots);
    const next = currentIdx + 1;
    if (next >= foods.length) {
      addPoints(1).then(() => setPointsMsg("+1 puan kazandın! 🎉")).catch(() => {});
      setPhase("result");
    } else {
      setCurrentIdx(next);
    }
  }

  function restart() {
    setPhase("category"); setFoods([]); setSlots(Array(10).fill(null));
    setCurrentIdx(0); setPointsMsg(null); setExpandedCat(null);
  }

  function handleShare() {
    const filled = slots.filter(Boolean) as Food[];
    const ranking = filled.map((f, i) => `${i + 1}. ${f.title}`).join('\n');
    const catLine = selLabel ? `"${selLabel}" kategorisini sıraladım.\n\n` : "";
    const text = `🙈 Menü Günlüğü'nde Kör Sıralama oynadım!\n${catLine}Sıralamam:\n${ranking}\n\nmenugunlugu.com'da sen de sırala!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  /* ── CATEGORY ── */
  if (phase === "category") {
    const expandedObj = CATS.find(c => c.key === expandedCat);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4A2260] to-[#2A1040] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/oyna" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div className="text-center flex-1 mx-4">
              <p className="font-bold text-white">Kör Sıralama 🙈</p>
              <p className="text-xs text-white/60">Kategori seç ve oynamaya başla!</p>
            </div>
            <div className="w-9" />
          </div>

          <div className="text-xs font-semibold text-white/50 text-center tracking-wider uppercase mb-3">Ana Kategoriler</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {CATS.map(c => (
              <button key={c.key} onClick={() => toggleCat(c.key)}
                className={`relative rounded-2xl overflow-hidden h-20 text-left ${expandedCat === c.key ? "ring-2 ring-offset-1" : ""}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${c.bg}`} />
                <span className="absolute right-1 bottom-[-6px] text-6xl opacity-25">{c.emoji}</span>
                <div className="relative p-3 flex flex-col h-full justify-between">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" className={`ml-auto transition-transform ${expandedCat === c.key ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                  <p className="font-extrabold text-white text-sm">{c.label}</p>
                </div>
              </button>
            ))}
          </div>

          {expandedCat && expandedObj && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-white/50 text-center tracking-wider uppercase mb-3">Alt Kategoriler</div>
              <button onClick={() => pickCat(expandedCat)}
                className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-3 text-white font-bold text-sm bg-gradient-to-r ${expandedObj.bg}`}>
                <span>{expandedObj.emoji}</span>
                <span className="flex-1 text-left">Tüm {LABEL_PLURAL[expandedCat]} ile Oyna</span>
                <span>→</span>
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {(SUBCATEGORIES[expandedCat] ?? []).filter(sub => (subcatCounts[sub] ?? 0) >= MIN_RECIPES).map(sub => (
                  <button key={sub} onClick={() => pickSubcat(expandedCat, sub)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-colors">
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "loading") return (
    <div className="min-h-screen bg-gradient-to-b from-[#4A2260] to-[#2A1040] flex items-center justify-center flex-col gap-3">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Tarifler yükleniyor…</p>
    </div>
  );

  /* ── RESULT ── */
  if (phase === "result") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4A2260] to-[#2A1040] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-extrabold text-white mb-1">Sıralamana Bak! 🏅</h1>
          <p className="text-white/60 text-sm mb-4">İşte senin nihai sıralaman</p>
          {pointsMsg && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 bg-white/15 rounded-xl px-4 py-2.5 text-white font-bold text-sm text-center">{pointsMsg}</div>
              <button onClick={handleShare}
                className="flex-shrink-0 bg-[#E07A2F] hover:bg-[#B85E1A] rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-colors">
                Paylaş
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {slots.map((food, idx) => food && (
              <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 border border-white/15">
                <span className={`text-sm font-extrabold w-6 text-center flex-shrink-0 ${idx < 3 ? "text-[#E07A2F]" : "text-white/40"}`}>{idx + 1}</span>
                {food.image_url && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <Image src={food.image_url} alt={food.title} fill className="object-cover" />
                  </div>
                )}
                <p className="font-bold text-white text-xs leading-snug line-clamp-2 flex-1 min-w-0">{food.title}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={restart}
              className="flex-1 py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold transition-colors text-sm">
              Tekrar Oyna
            </button>
            <Link href="/oyna"
              className="flex-1 py-3.5 bg-transparent hover:bg-white/10 border border-white/25 rounded-2xl text-white/80 font-bold transition-colors text-sm text-center flex items-center justify-center">
              Oyun Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── GAME ── */
  const current = foods[currentIdx];
  const placed  = slots.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAF7F4] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <button onClick={restart} className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-100 hover:bg-warm-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2B1F" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-xs font-semibold text-warm-500 bg-warm-100 px-3 py-1.5 rounded-full">{placed} / 10 yerleştirdin</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden mb-4 h-44">
          {current?.image_url
            ? <Image src={current.image_url} alt={current.title} fill className="object-cover" />
            : <div className="w-full h-full bg-warm-100 flex items-center justify-center text-5xl">🍽️</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="inline-block bg-[#E07A2F] text-white text-xs font-bold px-2.5 py-1 rounded-lg mb-2">{currentIdx + 1}. yemek</div>
            <p className="text-white font-extrabold text-xl leading-tight">{current?.title}</p>
            <p className="text-white/55 text-xs mt-1">Bu yemeği kaçıncı sıraya koyarsın? Dokunarak yerleştir.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slots.map((food, idx) => (
            <button key={idx} onClick={() => placeAt(idx)} disabled={!!food}
              className={`rounded-2xl p-3 flex items-center gap-2.5 min-h-[60px] transition-all ${
                food
                  ? "bg-[rgba(224,122,47,0.1)] border border-[rgba(224,122,47,0.3)]"
                  : "bg-[rgba(61,43,31,0.04)] border border-dashed border-[rgba(61,43,31,0.2)] hover:border-[rgba(61,43,31,0.4)]"
              }`}>
              <span className={`text-xl font-black w-7 text-center flex-shrink-0 ${food ? "text-[#E07A2F] text-base" : "text-[rgba(61,43,31,0.18)]"}`}>{idx + 1}</span>
              {food ? (
                <>
                  {food.image_url && (
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={food.image_url} alt={food.title} fill className="object-cover" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-warm-800 leading-tight line-clamp-2 flex-1 text-left">{food.title}</p>
                </>
              ) : (
                <p className="text-xs text-warm-400">Seç</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
