"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Food { id: string; title: string; slug: string; image_url: string | null }
type Phase = "category" | "loading" | "game" | "champion";

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
const MIN_RECIPES = 8;
const ROUND_NAMES = ["Çeyrek Final", "Yarı Final", "Final"];

async function addPoints(pts: number) {
  try {
    await fetch("/api/oyun/puan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ points: pts }) });
  } catch { /* ignore */ }
}

export default function TurnuvaGame() {
  const [phase, setPhase]             = useState<Phase>("category");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subcatCounts, setSubcatCounts] = useState<Record<string, number>>({});

  // game state
  const [rounds, setRounds]       = useState<Food[][]>([]);
  const [matchIdx, setMatchIdx]   = useState(0);
  const [winners, setWinners]     = useState<Food[]>([]);
  const [champion, setChampion]   = useState<Food | null>(null);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);

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
    if (!data || data.length < MIN_RECIPES) { setPhase("category"); return; }
    startGame(shuffle(data as Food[]).slice(0, 8));
  }

  async function pickSubcat(catKey: string, subcat: string) {
    setPhase("loading");
    const { data } = await supabase.from("recipes").select("id, title, slug, image_url")
      .eq("category", catKey).eq("approval_status", "approved").not("image_url", "is", null)
      .contains("subcategories", [subcat]);
    if (!data || data.length < MIN_RECIPES) { setPhase("category"); return; }
    startGame(shuffle(data as Food[]).slice(0, 8));
  }

  function startGame(bracket: Food[]) {
    setRounds([bracket]);
    setMatchIdx(0);
    setWinners([]);
    setChampion(null);
    setPointsMsg(null);
    setPhase("game");
  }

  function restart() {
    setPhase("category");
    setRounds([]); setMatchIdx(0); setWinners([]);
    setChampion(null); setPointsMsg(null); setExpandedCat(null);
  }

  function pick(winner: Food, side: "left" | "right") {
    setAnimating(side);
    setTimeout(() => {
      setAnimating(null);
      const currentRound = rounds[rounds.length - 1];
      const totalMatches = currentRound.length / 2;
      const nextWinners = [...winners, winner];

      if (nextWinners.length < totalMatches) {
        setMatchIdx(m => m + 1);
        setWinners(nextWinners);
      } else if (nextWinners.length === 1) {
        setChampion(nextWinners[0]);
        addPoints(1).then(() => setPointsMsg("+1 puan kazandın! 🎉")).catch(() => {});
        setPhase("champion");
      } else {
        setRounds(r => [...r, nextWinners]);
        setMatchIdx(0);
        setWinners([]);
      }
    }, 300);
  }

  /* ── CATEGORY ── */
  if (phase === "category") {
    const expandedObj = CATS.find(c => c.key === expandedCat);
    return (
      <div className="min-h-screen bg-[#FAF7F4] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/oyna" className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-100 hover:bg-warm-200 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2B1F" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div className="text-center flex-1 mx-4">
              <p className="font-bold text-warm-900">Turnuva 🏆</p>
              <p className="text-xs text-warm-400">Kategori seç ve oynamaya başla!</p>
            </div>
            <div className="w-9" />
          </div>

          <div className="text-xs font-semibold text-warm-400 text-center tracking-wider uppercase mb-3">Ana Kategoriler</div>
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
              <div className="text-xs font-semibold text-warm-400 text-center tracking-wider uppercase mb-3">Alt Kategoriler</div>
              <button onClick={() => pickCat(expandedCat)}
                className={`w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-3 text-white font-bold text-sm bg-gradient-to-r ${expandedObj.bg}`}>
                <span>{expandedObj.emoji}</span>
                <span className="flex-1 text-left">Tüm {LABEL_PLURAL[expandedCat]} ile Oyna</span>
                <span>→</span>
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {(SUBCATEGORIES[expandedCat] ?? []).filter(sub => (subcatCounts[sub] ?? 0) >= MIN_RECIPES).map(sub => (
                  <button key={sub} onClick={() => pickSubcat(expandedCat, sub)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-warm-200 text-warm-700 hover:bg-warm-50 transition-colors">
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
    <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center flex-col gap-3">
      <div className="w-8 h-8 border-4 border-warm-200 border-t-[#C8922A] rounded-full animate-spin" />
      <p className="text-warm-500 text-sm">Tarifler yükleniyor…</p>
    </div>
  );

  /* ── CHAMPION ── */
  if (phase === "champion" && champion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#8B6010] to-[#3D2800] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col items-center">
          <button onClick={restart} className="text-white/60 text-sm mb-6 hover:text-white/90 self-start">← Geri</button>
          <div className="text-center mb-8">
            <span className="text-6xl block mb-4">🏆</span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Şampiyon!</h1>
            <p className="text-white/60 text-sm">Turnuvayı kazanan yemek</p>
          </div>
          {pointsMsg && (
            <div className="mb-6 bg-white/15 rounded-xl px-5 py-3 text-white font-bold text-sm text-center">{pointsMsg}</div>
          )}
          <div className="w-full max-w-xs">
            <div className="aspect-square rounded-3xl overflow-hidden border-4 border-yellow-400/60 shadow-2xl mb-4 relative">
              {champion.image_url
                ? <Image src={champion.image_url} alt={champion.title} fill className="object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center text-6xl">🍴</div>}
            </div>
            <p className="text-xl font-extrabold text-white text-center mb-2">{champion.title}</p>
            <Link href={`/tarifler/${champion.slug}`}
              className="block text-center text-sm text-yellow-300/80 hover:text-yellow-300 transition-colors mb-6">
              Tarife git →
            </Link>
          </div>
          <button onClick={restart}
            className="w-full max-w-xs py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold transition-colors">
            Yeni Turnuva
          </button>
        </div>
      </div>
    );
  }

  /* ── GAME ── */
  const currentRound = rounds.length - 1;
  const currentPairs = rounds[currentRound] ?? [];
  const left  = currentPairs[matchIdx * 2];
  const right = currentPairs[matchIdx * 2 + 1];
  const totalMatches = currentPairs.length / 2;

  if (!left || !right) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8922A] to-[#5A3800] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6">
          <button onClick={restart} className="text-white/60 text-sm hover:text-white/90 transition-colors">← Geri</button>
          <div className="text-center">
            <p className="text-white font-extrabold text-sm">{ROUND_NAMES[currentRound] ?? "Final"}</p>
            <p className="text-white/55 text-xs">{matchIdx + 1} / {totalMatches} maç</p>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalMatches }).map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < matchIdx ? "bg-white" : i === matchIdx ? "bg-white/50" : "bg-white/15"}`} />
          ))}
        </div>

        <h1 className="text-center text-2xl font-extrabold text-white mb-1">Turnuva 🏆</h1>
        <p className="text-center text-white/60 text-sm mb-8">Hangisi kazansın?</p>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {([{ r: left, side: "left" as const }, { r: right, side: "right" as const }]).map(({ r, side }) => (
            <button key={r.id} onClick={() => pick(r, side)} disabled={!!animating}
              className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
                animating === side ? "scale-95 border-white opacity-80" : "border-white/20 hover:border-white/70 hover:scale-[1.02]"
              } flex flex-col`}
              style={{ minHeight: 220 }}>
              {r.image_url
                ? <Image src={r.image_url} alt={r.title} fill className="object-cover" />
                : <div className="absolute inset-0 bg-white/10 flex items-center justify-center text-6xl">🍴</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 mt-auto p-3">
                <p className="text-white font-bold text-sm leading-snug text-left">{r.title}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">Favorini seç ilerlesin</p>
      </div>
    </div>
  );
}
