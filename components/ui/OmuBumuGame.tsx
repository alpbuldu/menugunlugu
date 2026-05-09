"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Recipe { id: string; title: string; slug: string; image_url: string | null }
type Phase = "category" | "loading" | "game" | "result";
type PickSide = "left" | "right";

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }
function seededPercent(a: string, b: string) {
  const seed = [...(a + b)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 40 + (seed % 35);
}

const CATS = [
  { key: "soup",    label: "Çorba",          emoji: "🥣", bg: "from-[#C4872A] to-[#8B5A18]" },
  { key: "main",    label: "Ana Yemek",       emoji: "🍖", bg: "from-[#B05A38] to-[#7A3A20]" },
  { key: "side",    label: "Yardımcı Lezzet", emoji: "🥗", bg: "from-[#7A9A4A] to-[#4A6A20]" },
  { key: "dessert", label: "Tatlı",           emoji: "🍰", bg: "from-[#9A6A7A] to-[#6A3A4A]" },
];

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

export default function OmuBumuGame() {
  const [phase, setPhase]           = useState<Phase>("category");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subcatCounts, setSubcatCounts] = useState<Record<string, number>>({});
  const [selLabel, setSelLabel]     = useState("");
  const [foods, setFoods]           = useState<Recipe[]>([]);
  const [left, setLeft]             = useState<Recipe | null>(null);
  const [right, setRight]           = useState<Recipe | null>(null);
  const [nextIdx, setNextIdx]       = useState(2);
  const [round, setRound]           = useState(1);
  const [total, setTotal]           = useState(9);
  const [winner, setWinner]         = useState<Recipe | null>(null);
  const [picked, setPicked]         = useState<PickSide | null>(null);
  const [lastPercent, setLastPercent] = useState<number | null>(null);
  const [pointsMsg, setPointsMsg]   = useState<string | null>(null);
  const swipeStart = useRef<number | null>(null);

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

  async function loadGame(catKey: string, label: string, subcat?: string) {
    setPhase("loading");
    let q = supabase.from("recipes").select("id, title, slug, image_url")
      .eq("category", catKey).eq("approval_status", "approved").not("image_url", "is", null);
    if (subcat) q = q.contains("subcategories", [subcat]);
    const { data } = await q;
    if (!data || data.length < 2) { setPhase("category"); return; }
    const game = shuffle(data as Recipe[]).slice(0, 10);
    setSelLabel(label);
    setFoods(game);
    setLeft(game[0]); setRight(game[1]);
    setNextIdx(2); setRound(1); setTotal(game.length - 1);
    setLastPercent(null); setPointsMsg(null);
    setPhase("game");
  }

  function choose(side: PickSide, l: Recipe, r: Recipe) {
    if (picked) return;
    setPicked(side);
    const champ = side === "left" ? l : r;
    const loser = side === "left" ? r : l;
    const pct = seededPercent(champ.id, loser.id);

    setTimeout(() => {
      setPicked(null);
      setLastPercent(pct);
      if (nextIdx >= foods.length) {
        setWinner(champ);
        fetch("/api/oyun/puan", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: 1 }),
        }).then(() => setPointsMsg("+1 puan kazandın! 🎉")).catch(() => setPointsMsg("+1 puan kazandın! 🎉"));
        setPhase("result");
        return;
      }
      setLeft(champ); setRight(foods[nextIdx]);
      setNextIdx(i => i + 1); setRound(r => r + 1);
    }, 360);
  }

  function restart() {
    setPhase("category"); setWinner(null); setFoods([]);
    setPicked(null); setLastPercent(null); setPointsMsg(null); setExpandedCat(null);
  }

  function handleShare() {
    if (!winner) return;
    const text = `O mu Bu mu? oynadım 🤔\n${selLabel ? `${selLabel} arasından ` : ""}"${winner.title}" kazandı!\nmenugunlugu.com/omubumu`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  function onTouchStart(e: React.TouchEvent) { swipeStart.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (swipeStart.current === null || !left || !right) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) < 60) return;
    choose(dx > 0 ? "left" : "right", left, right);
  }

  /* ── KATEGORİ ── */
  if (phase === "category") {
    const expandedObj = CATS.find(c => c.key === expandedCat);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E07A2F] to-[#7A3000] flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/oyna" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div className="text-center flex-1 mx-4">
              <p className="font-bold text-white">O mu Bu mu? 🤔</p>
              <p className="text-xs text-white/60">Kategori seç ve oynamaya başla!</p>
            </div>
            <div className="w-9" />
          </div>

          <div className="text-xs font-semibold text-white/50 text-center tracking-wider uppercase mb-3">Ana Kategoriler</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {CATS.map(c => (
              <button key={c.key} onClick={() => toggleCat(c.key)}
                className={`relative rounded-2xl overflow-hidden h-20 text-left ${expandedCat === c.key ? "ring-2 ring-offset-1 ring-[#E07A2F]" : ""}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${c.bg}`} />
                <span className="absolute right-1 bottom-[-6px] text-6xl opacity-25">{c.emoji}</span>
                <div className="relative p-3 flex flex-col h-full justify-between">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"
                    className={`ml-auto transition-transform ${expandedCat === c.key ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                  <p className="font-extrabold text-white text-sm">{c.label}</p>
                </div>
              </button>
            ))}
          </div>

          {expandedCat && expandedObj && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-white/50 text-center tracking-wider uppercase mb-3">Alt Kategoriler</div>
              <button onClick={() => loadGame(expandedCat, CATS.find(c => c.key === expandedCat)?.label ?? "")}
                className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-3 text-white font-bold text-sm bg-gradient-to-r ${expandedObj.bg}`}>
                <span>{expandedObj.emoji}</span>
                <span className="flex-1 text-left">Tüm {LABEL_PLURAL[expandedCat]} ile Oyna</span>
                <span>→</span>
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {(SUBCATEGORIES[expandedCat] ?? []).filter(sub => (subcatCounts[sub] ?? 0) >= MIN_RECIPES).map(sub => (
                  <button key={sub} onClick={() => loadGame(expandedCat, sub, sub)}
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
    <div className="min-h-screen bg-gradient-to-b from-[#E07A2F] to-[#7A3000] flex items-center justify-center flex-col gap-3">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Tarifler yükleniyor…</p>
    </div>
  );

  /* ── SONUÇ ── */
  if (phase === "result" && winner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#B05018] to-[#4A2000] flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center">
          <div className="text-center mb-5">
            <span className="text-5xl block mb-3">🤔</span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Kazanan!</h1>
            <p className="text-white/65 text-sm leading-snug">
              <span className="text-white font-semibold">{winner.title}</span> en sevdiğin yemek!
            </p>
          </div>

          <div className="w-full max-w-xs mb-4">
            <div className="aspect-[16/9] rounded-3xl overflow-hidden border-4 border-[#E07A2F]/60 shadow-2xl relative">
              {winner.image_url
                ? <Image src={winner.image_url} alt={winner.title} fill className="object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center text-6xl">🍽️</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <p className="text-white font-extrabold text-sm leading-tight mb-2">{winner.title}</p>
                <Link href={`/tarifler/${winner.slug}`}
                  className="inline-block text-[11px] text-white font-semibold border border-[#E07A2F] rounded-full px-3 py-1 hover:bg-[#E07A2F] transition-colors">
                  Tarife git
                </Link>
              </div>
            </div>
          </div>

          {pointsMsg && (
            <div className="w-full max-w-xs mb-4 flex items-center gap-2">
              <div className="flex-1 bg-white/15 rounded-xl px-4 py-2.5 text-white font-bold text-sm text-center">{pointsMsg}</div>
              <button onClick={handleShare}
                className="flex-shrink-0 bg-[#E07A2F] hover:bg-[#B85E1A] rounded-xl px-4 py-2.5 text-white font-bold text-sm transition-colors">
                Paylaş
              </button>
            </div>
          )}

          <div className="w-full max-w-xs flex gap-3">
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

  /* ── OYUN ── */
  if (!left || !right) return null;
  const motivation = "Tarafını seç, en sevdiğini bul!";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E07A2F] to-[#7A3000] flex flex-col"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="max-w-4xl mx-auto w-full px-4 py-5 flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={restart} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <p className="text-white font-extrabold text-base">Tarafını seç!</p>
            <p className="text-white/55 text-xs">Tur {round} / {total}</p>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
              i < round - 1 ? "bg-white" : i === round - 1 ? "bg-white/50" : "bg-white/15"
            }`} />
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 mb-3 select-none">
          {([["left", left], ["right", right]] as [PickSide, Recipe][]).map(([side, food]) => {
            const isWinner = picked === side;
            const isLoser  = picked !== null && picked !== side;
            return (
              <div key={side + food.id}
                onClick={() => choose(side, left, right)}
                className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isWinner ? "scale-[1.03] border-white opacity-100" :
                  isLoser  ? "scale-95 border-white/20 opacity-50" :
                  "border-white/20 hover:border-white/70 hover:scale-[1.02] active:scale-95"
                }`}>
                <div className="relative aspect-[1/1]">
                  {food.image_url
                    ? <Image src={food.image_url} alt={food.title} fill className="object-cover" />
                    : <div className="absolute inset-0 bg-white/10 flex items-center justify-center text-4xl">🍴</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  {isWinner && (
                    <div className="absolute top-2 right-2 w-7 h-7 bg-[#E07A2F] rounded-full flex items-center justify-center shadow-lg">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center">
                    <p className="text-white font-bold text-xs leading-snug line-clamp-2">{food.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* VS badge */}
        <div className="relative -mt-[calc(50%_+_1.5rem)] mb-3 flex justify-center pointer-events-none" style={{ marginTop: 0 }}>
        </div>

        {/* Info box */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
          {lastPercent !== null ? (
            <>
              <p className="text-white/85 text-xs font-semibold">
                Kullanıcıların <span className="text-white font-extrabold">%{lastPercent}</span>&apos;i seninle aynı seçimi yaptı
              </p>
              <p className="text-white/45 text-[10px] mt-0.5">{motivation}</p>
            </>
          ) : (
            <p className="text-white/60 text-xs">{motivation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
