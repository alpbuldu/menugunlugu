"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface Recipe { id: string; title: string; slug: string; image_url: string | null; }
type Phase = "game" | "result" | "done";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

async function addPoints(pts: number) {
  try {
    await fetch("/api/oyun/puan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    });
  } catch { /* ignore */ }
}

export default function KorSiralamaGame({ pool }: { pool: Recipe[] }) {
  const [phase, setPhase]     = useState<Phase>("game");
  const [round, setRound]     = useState<Recipe[]>(() => shuffle(pool).slice(0, 4));
  const [ranking, setRanking] = useState<Recipe[]>([]);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);

  function pickNext(recipe: Recipe) {
    const next = [...ranking, recipe];
    setRanking(next);
    if (next.length === 4) {
      setPhase("result");
      addPoints(1).then(() => setPointsMsg("+1 puan kazandın! 🎉")).catch(() => {});
    }
  }

  const remaining = round.filter(r => !ranking.includes(r));

  function playAgain() {
    setRound(shuffle(pool).slice(0, 4));
    setRanking([]);
    setPointsMsg(null);
    setPhase("game");
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4A2260] to-[#2A1040] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col flex-1">
          <Link href="/oyna" className="text-white/60 text-sm mb-6 hover:text-white/90 transition-colors self-start">← Oyunlara Dön</Link>
          <h1 className="text-2xl font-extrabold text-white mb-1">Sıralamanı Tamamladın!</h1>
          <p className="text-white/60 text-sm mb-6">İşte isimleri görünce ne düşüneceksin? 😄</p>
          {pointsMsg && (
            <div className="mb-4 bg-white/15 rounded-xl px-4 py-2.5 text-white font-bold text-sm text-center">{pointsMsg}</div>
          )}
          <div className="space-y-3 mb-8">
            {ranking.map((r, i) => (
              <div key={r.id} className="flex items-center gap-4 bg-white/10 rounded-2xl p-3 border border-white/15">
                <span className="text-2xl font-extrabold text-white/40 w-8 text-center flex-shrink-0">{i + 1}</span>
                {r.image_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white leading-snug">{r.title}</p>
                  <Link href={`/recipes/${r.slug}`} className="text-xs text-white/50 hover:text-white/80 transition-colors">
                    Tarife git →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <button onClick={playAgain}
            className="w-full py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold transition-colors">
            Tekrar Oyna
          </button>
        </div>
      </div>
    );
  }

  const currentRecipe = remaining[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4A2260] to-[#2A1040] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6">
          <Link href="/oyna" className="text-white/60 text-sm hover:text-white/90 transition-colors">← Geri</Link>
          <span className="text-white/60 text-sm font-semibold">{ranking.length + 1}/4</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Kör Sıralama 🙈</h1>
          <p className="text-white/65 text-sm">Sadece görsele bakarak en sevdiğinden başla seç</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < ranking.length ? "bg-white" : i === ranking.length ? "bg-white/40" : "bg-white/15"}`} />
          ))}
        </div>

        {/* Sıralı seçimler */}
        {ranking.length > 0 && (
          <div className="mb-5">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Seçtiklerin</p>
            <div className="flex gap-2">
              {ranking.map((r, i) => (
                <div key={r.id} className="flex-1 text-center">
                  <div className="relative">
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-white/30">
                      {r.image_url
                        ? <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-white/10 flex items-center justify-center text-2xl">🍴</div>}
                    </div>
                    <span className="absolute -top-2 -left-1 bg-white text-[#4A2260] text-xs font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kalan yemekler */}
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
          {ranking.length === 0 ? "En sevdiğin hangisi?" : `${ranking.length + 1}. sıraya hangisini koyuyorsun?`}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {remaining.map(r => (
            <button key={r.id} onClick={() => pickNext(r)}
              className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/60 hover:scale-[1.02] transition-all group">
              {r.image_url
                ? <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center text-5xl">🍴</div>}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
