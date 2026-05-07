"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuizRecipe } from "./page";

interface Question { recipe: QuizRecipe; options: QuizRecipe[]; }
type AnswerState = "idle" | "correct" | "wrong";

const BLUR_LEVELS = [28, 18, 10, 4, 0]; // px — 0 = tam görünür
const POINTS_PER_REVEAL = 2;
const BASE_POINTS = 10;

async function submitPoints(pts: number) {
  if (pts <= 0) return;
  try {
    await fetch("/api/oyun/puan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    });
  } catch { /* ignore */ }
}

export default function QuizGame({ questions }: { questions: Question[] }) {
  const [qIdx, setQIdx]           = useState(0);
  const [blurLevel, setBlurLevel] = useState(0); // BLUR_LEVELS index
  const [answered, setAnswered]   = useState<AnswerState>("idle");
  const [selected, setSelected]   = useState<string | null>(null);
  const [scores, setScores]       = useState<number[]>([]);
  const [done, setDone]           = useState(false);
  const [totalAdded, setTotalAdded] = useState<number | null>(null);

  const q = questions[qIdx];
  const blurPx = BLUR_LEVELS[blurLevel];
  const currentMax = Math.max(BASE_POINTS - blurLevel * POINTS_PER_REVEAL, POINTS_PER_REVEAL);

  function reveal() {
    if (blurLevel < BLUR_LEVELS.length - 1 && answered === "idle") {
      setBlurLevel(l => l + 1);
    }
  }

  function answer(optionId: string) {
    if (answered !== "idle") return;
    setSelected(optionId);
    const correct = optionId === q.recipe.id;
    setAnswered(correct ? "correct" : "wrong");
    const earned = correct ? currentMax : 0;
    setScores(s => [...s, earned]);
  }

  function next() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) {
      // oyun bitti
      const total = scores.reduce((a, b) => a + b, 0);
      setDone(true);
      submitPoints(total).then(() => setTotalAdded(total)).catch(() => setTotalAdded(total));
    } else {
      setQIdx(nextIdx);
      setBlurLevel(0);
      setAnswered("idle");
      setSelected(null);
    }
  }

  if (done) {
    const total = scores.reduce((a, b) => a + b, 0);
    const maxPossible = questions.length * BASE_POINTS;
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#3A6B6B] to-[#0F2D2D] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8">
          <Link href="/oyna" className="text-white/60 text-sm mb-6 block hover:text-white/90">← Oyunlara Dön</Link>
          <div className="text-center mb-8">
            <span className="text-5xl block mb-3">
              {total >= maxPossible * 0.8 ? "🌟" : total >= maxPossible * 0.5 ? "👍" : "🎯"}
            </span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Quiz Bitti!</h1>
            <p className="text-white/60 text-sm">10 sorudan {scores.filter(s => s > 0).length} doğru</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center mb-6">
            <p className="text-5xl font-extrabold text-white mb-1">{total}</p>
            <p className="text-white/60 text-sm">/ {maxPossible} puan</p>
            {totalAdded !== null && totalAdded > 0 && (
              <p className="mt-3 text-emerald-300 font-bold text-sm">+{totalAdded} puan hesabına eklendi 🎉</p>
            )}
          </div>
          {/* Özet */}
          <div className="space-y-2 mb-8">
            {questions.map((q, i) => (
              <div key={q.recipe.id} className="flex items-center gap-3 bg-white/8 rounded-xl p-3">
                <span className="text-base flex-shrink-0">{scores[i] > 0 ? "✅" : "❌"}</span>
                <p className="text-white text-sm font-semibold flex-1 truncate">{q.recipe.title}</p>
                <span className="text-white/60 text-sm font-bold">{scores[i] ?? 0} pt</span>
              </div>
            ))}
          </div>
          <Link href="/oyna/quiz"
            className="block w-full py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold text-center transition-colors">
            Yeni Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3A6B6B] to-[#0F2D2D] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/oyna" className="text-white/60 text-sm hover:text-white/90">← Geri</Link>
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < qIdx ? "bg-emerald-400" : i === qIdx ? "bg-white" : "bg-white/20"
              }`} />
            ))}
          </div>
          <span className="text-white/60 text-sm font-semibold">{qIdx + 1}/{questions.length}</span>
        </div>

        {/* Puan göstergesi */}
        <div className="text-center mb-4">
          <span className="inline-block bg-white/15 border border-white/25 rounded-full px-3 py-1 text-white text-xs font-bold">
            Bu soru: {currentMax} puan
          </span>
        </div>

        {/* Görsel */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 flex-shrink-0">
          <img
            src={q.recipe.image_url}
            alt="?"
            className="w-full h-full object-cover transition-all duration-500"
            style={{ filter: `blur(${blurPx}px)`, transform: blurPx > 0 ? "scale(1.1)" : "scale(1)" }}
          />
          {answered === "idle" && blurLevel < BLUR_LEVELS.length - 1 && (
            <button onClick={reveal}
              className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              İpucu Al (-{POINTS_PER_REVEAL} pt)
            </button>
          )}
          {answered !== "idle" && (
            <div className={`absolute inset-0 flex items-center justify-center ${answered === "correct" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              <span className="text-5xl">{answered === "correct" ? "✅" : "❌"}</span>
            </div>
          )}
        </div>

        {/* Soru */}
        <p className="text-center text-white/70 text-sm font-semibold mb-4">Bu yemek hangisi?</p>

        {/* Seçenekler */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {q.options.map(opt => {
            const isCorrect = opt.id === q.recipe.id;
            const isSelected = opt.id === selected;
            let cls = "rounded-xl px-3 py-3 text-sm font-semibold text-left transition-all border-2 ";
            if (answered === "idle") {
              cls += "bg-white/12 border-white/20 text-white hover:bg-white/20 hover:border-white/40";
            } else if (isCorrect) {
              cls += "bg-emerald-500/30 border-emerald-400 text-white";
            } else if (isSelected) {
              cls += "bg-red-500/30 border-red-400 text-white";
            } else {
              cls += "bg-white/6 border-white/10 text-white/40";
            }
            return (
              <button key={opt.id} onClick={() => answer(opt.id)} disabled={answered !== "idle"} className={cls}>
                {opt.title}
              </button>
            );
          })}
        </div>

        {answered !== "idle" && (
          <button onClick={next}
            className="w-full py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-2xl text-white font-bold transition-colors">
            {qIdx + 1 < questions.length ? "Sonraki Soru →" : "Sonuçları Gör"}
          </button>
        )}
      </div>
    </div>
  );
}
