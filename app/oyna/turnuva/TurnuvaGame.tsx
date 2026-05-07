"use client";

import { useState } from "react";
import Link from "next/link";

interface Recipe { id: string; title: string; slug: string; image_url: string | null; }
type Phase = "game" | "champion";

const ROUND_NAMES = ["Çeyrek Final", "Yarı Final", "Final"];

async function addPoints(pts: number) {
  try {
    await fetch("/api/oyun/puan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    });
  } catch { /* ignore */ }
}

export default function TurnuvaGame({ bracket }: { bracket: Recipe[] }) {
  // rounds[0] = [r1,r2,r3,r4,r5,r6,r7,r8]  (QF — 4 matches)
  // rounds[1] = winners of QF (SF — 2 matches)
  // rounds[2] = winners of SF (F — 1 match)
  const [rounds, setRounds]       = useState<Recipe[][]>([bracket]);
  const [matchIdx, setMatchIdx]   = useState(0); // current match in current round
  const [winners, setWinners]     = useState<Recipe[]>([]);
  const [champion, setChampion]   = useState<Recipe | null>(null);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);

  const currentRound = rounds.length - 1;
  const currentPairs = rounds[currentRound];
  const left  = currentPairs[matchIdx * 2];
  const right = currentPairs[matchIdx * 2 + 1];
  const totalMatches = currentPairs.length / 2;

  function pick(winner: Recipe, side: "left" | "right") {
    setAnimating(side);
    setTimeout(() => {
      setAnimating(null);
      const nextWinners = [...winners, winner];

      if (nextWinners.length < totalMatches) {
        setMatchIdx(m => m + 1);
        setWinners(nextWinners);
      } else {
        // round tamamlandı
        if (nextWinners.length === 1) {
          // şampiyon!
          setChampion(nextWinners[0]);
          addPoints(1).then(() => setPointsMsg("+1 puan kazandın! 🎉")).catch(() => {});
        } else {
          setRounds(r => [...r, nextWinners]);
          setMatchIdx(0);
          setWinners([]);
        }
      }
    }, 300);
  }

  function playAgain() {
    setRounds([bracket]);
    setMatchIdx(0);
    setWinners([]);
    setChampion(null);
    setPointsMsg(null);
  }

  if (champion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#8B6010] to-[#3D2800] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col items-center">
          <Link href="/oyna" className="text-white/60 text-sm mb-6 hover:text-white/90 self-start">← Oyunlara Dön</Link>
          <div className="text-center mb-8">
            <span className="text-6xl block mb-4">🏆</span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Şampiyon!</h1>
            <p className="text-white/60 text-sm">Turnuvayı kazanan yemek</p>
          </div>
          {pointsMsg && (
            <div className="mb-6 bg-white/15 rounded-xl px-5 py-3 text-white font-bold text-sm text-center">{pointsMsg}</div>
          )}
          <div className="w-full max-w-xs">
            <div className="aspect-square rounded-3xl overflow-hidden border-4 border-yellow-400/60 shadow-2xl mb-4">
              {champion.image_url
                ? <img src={champion.image_url} alt={champion.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center text-6xl">🍴</div>}
            </div>
            <p className="text-xl font-extrabold text-white text-center mb-2">{champion.title}</p>
            <Link href={`/recipes/${champion.slug}`}
              className="block text-center text-sm text-yellow-300/80 hover:text-yellow-300 transition-colors mb-6">
              Tarife git →
            </Link>
          </div>
          <button onClick={playAgain}
            className="w-full max-w-xs py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold transition-colors">
            Yeni Turnuva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#C8922A] to-[#5A3800] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/oyna" className="text-white/60 text-sm hover:text-white/90 transition-colors">← Geri</Link>
          <div className="text-center">
            <p className="text-white font-extrabold text-sm">{ROUND_NAMES[currentRound] ?? "Final"}</p>
            <p className="text-white/55 text-xs">{matchIdx + 1} / {totalMatches} maç</p>
          </div>
          <div className="w-12" />
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalMatches }).map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < matchIdx ? "bg-white" : i === matchIdx ? "bg-white/50" : "bg-white/15"}`} />
          ))}
        </div>

        <h1 className="text-center text-2xl font-extrabold text-white mb-1">Turnuva 🏆</h1>
        <p className="text-center text-white/60 text-sm mb-8">Hangisi kazansın?</p>

        {/* Match cards */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {[{ r: left, side: "left" as const }, { r: right, side: "right" as const }].map(({ r, side }) => (
            <button key={r.id} onClick={() => pick(r, side)} disabled={!!animating}
              className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
                animating === side ? "scale-95 border-white opacity-80" : "border-white/20 hover:border-white/70 hover:scale-[1.02]"
              } flex flex-col`}
              style={{ minHeight: 220 }}>
              {r.image_url
                ? <img src={r.image_url} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
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
