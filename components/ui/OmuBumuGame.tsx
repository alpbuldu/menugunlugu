"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { key: "soup",    label: "Çorba",      emoji: "🥣", bg: "from-amber-50 to-orange-50",   border: "border-orange-200",  text: "text-orange-700" },
  { key: "main",    label: "Ana Yemek",  emoji: "🍽️", bg: "from-red-50 to-rose-50",       border: "border-rose-200",    text: "text-rose-700"   },
  { key: "side",    label: "Yardımcı",   emoji: "🥗", bg: "from-green-50 to-emerald-50",  border: "border-green-200",   text: "text-green-700"  },
  { key: "dessert", label: "Tatlı",      emoji: "🍮", bg: "from-purple-50 to-pink-50",    border: "border-pink-200",    text: "text-pink-700"   },
];

interface Recipe {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
}

type Phase = "category" | "loading" | "game" | "result";
type PickSide = "left" | "right";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function OmuBumuGame() {
  const [phase, setPhase]           = useState<Phase>("category");
  const [catLabel, setCatLabel]     = useState("");
  const [foods, setFoods]           = useState<Recipe[]>([]);
  const [left, setLeft]             = useState<Recipe | null>(null);
  const [right, setRight]           = useState<Recipe | null>(null);
  const [nextIdx, setNextIdx]       = useState(2);
  const [round, setRound]           = useState(1);
  const [totalRounds, setTotalRounds] = useState(9);
  const [winner, setWinner]         = useState<Recipe | null>(null);
  const [picked, setPicked]         = useState<PickSide | null>(null); // animasyon için

  // Swipe desteği
  const swipeStart = useRef<number | null>(null);

  async function pickCategory(catKey: string, label: string) {
    setCatLabel(label);
    setPhase("loading");

    const supabase = createClient();
    const { data } = await supabase
      .from("recipes")
      .select("id, title, slug, image_url")
      .eq("category", catKey)
      .eq("approval_status", "approved");

    if (!data || data.length < 2) {
      setPhase("category");
      return;
    }

    const game = shuffle(data).slice(0, 10);
    setFoods(game);
    setLeft(game[0]);
    setRight(game[1]);
    setNextIdx(2);
    setRound(1);
    setTotalRounds(game.length - 1);
    setPhase("game");
  }

  function choose(side: PickSide) {
    if (picked) return;
    setPicked(side);

    setTimeout(() => {
      const champ = side === "left" ? left! : right!;
      setPicked(null);

      if (nextIdx >= foods.length) {
        setWinner(champ);
        setPhase("result");
        // +1 puan
        fetch("/api/oyun/puan", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: 1 }),
        }).catch(() => {});
        return;
      }

      setLeft(champ);
      setRight(foods[nextIdx]);
      setNextIdx((i) => i + 1);
      setRound((r) => r + 1);
    }, 380);
  }

  function restart() {
    setPhase("category");
    setWinner(null);
    setFoods([]);
    setPicked(null);
  }

  /* ── Swipe handlers ────────────────────────── */
  function onTouchStart(e: React.TouchEvent) {
    swipeStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (swipeStart.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) < 60) return;
    choose(dx > 0 ? "left" : "right");
  }

  /* ── Render ─────────────────────────────────── */

  if (phase === "category") {
    return (
      <div className="text-center">
        <p className="text-sm text-warm-500 mb-5">Bir kategori seç, en sevdiğini bul! 🏆</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => pickCategory(c.key, c.label)}
              className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95`}
            >
              <span className="text-3xl sm:text-4xl">{c.emoji}</span>
              <span className={`text-sm font-700 font-bold ${c.text}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-warm-500 text-sm">{catLabel} tarifleri yükleniyor…</p>
      </div>
    );
  }

  if (phase === "result" && winner) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="text-center">
          <p className="text-3xl mb-1">🏆</p>
          <p className="text-lg font-bold text-warm-900">Kazanan!</p>
          <p className="text-sm text-warm-500">En çok {winner.title} istiyorsun</p>
        </div>

        <div className="w-full max-w-xs">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg ring-4 ring-brand-400">
            {winner.image_url ? (
              <Image src={winner.image_url} alt={winner.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-warm-100 flex items-center justify-center text-5xl">🍽️</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-bold text-base leading-snug">{winner.title}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/tarifler/${winner.slug}`}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
          >
            Tarife Git →
          </Link>
          <button
            onClick={restart}
            className="px-5 py-2.5 bg-warm-100 text-warm-700 rounded-xl font-semibold text-sm hover:bg-warm-200 transition-colors"
          >
            Tekrar Oyna
          </button>
        </div>
      </div>
    );
  }

  /* ── Game phase ─────────────────────────────── */
  const progress = ((round - 1) / totalRounds) * 100;

  return (
    <div
      className="select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Üst bilgi */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={restart}
          className="text-xs text-warm-400 hover:text-warm-600 transition-colors flex items-center gap-1"
        >
          ← Kategori değiştir
        </button>
        <span className="text-xs font-semibold text-warm-500 bg-warm-100 px-3 py-1 rounded-full">
          Tur {round} / {totalRounds}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-warm-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {([["left", left], ["right", right]] as [PickSide, Recipe | null][]).map(([side, food]) => {
          if (!food) return null;
          const isWinner = picked === side;
          const isLoser  = picked !== null && picked !== side;

          return (
            <button
              key={side + food.id}
              onClick={() => choose(side)}
              disabled={!!picked}
              className="relative group rounded-2xl overflow-hidden shadow-sm border border-warm-100 transition-all duration-300 focus:outline-none"
              style={{
                transform: isWinner ? "scale(1.03)" : isLoser ? "scale(0.95)" : "scale(1)",
                opacity: isLoser ? 0.45 : 1,
              }}
            >
              {/* Görsel */}
              <div className="relative aspect-square sm:aspect-[4/3]">
                {food.image_url ? (
                  <Image src={food.image_url} alt={food.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-warm-100 flex items-center justify-center text-4xl">🍽️</div>
                )}

                {/* Hover/seçim overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: isWinner
                      ? "rgba(224,122,47,0.25)"
                      : "rgba(0,0,0,0)",
                    opacity: isWinner ? 1 : 0,
                  }}
                />

                {/* Kazanan tik */}
                {isWinner && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center shadow">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* İsim */}
              <div className="bg-white px-3 py-2.5">
                <p className="text-xs sm:text-sm font-semibold text-warm-800 leading-snug line-clamp-2 text-left">
                  {food.title}
                </p>
              </div>

              {/* Hover efekti (desktop) */}
              <div className="absolute inset-0 ring-2 ring-brand-400 ring-opacity-0 group-hover:ring-opacity-60 rounded-2xl transition-all pointer-events-none" />
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-warm-400 mt-3">
        Sevdiğini seç • Sola/sağa kaydır veya üstüne tıkla
      </p>
    </div>
  );
}
