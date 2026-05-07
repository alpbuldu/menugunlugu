"use client";

import { useState } from "react";
import Link from "next/link";
import type { KaloriQuestion } from "./page";

type AnswerState = "idle" | "correct" | "wrong";
const POINTS_CORRECT = 10;

async function submitPoints(pts: number) {
  if (pts <= 0) return;
  try {
    await fetch("/api/oyun/puan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    });
  } catch { /* ignore */ }
}

export default function QuizKaloriGame({ questions }: { questions: KaloriQuestion[] }) {
  const [qIdx, setQIdx]         = useState(0);
  const [answered, setAnswered] = useState<AnswerState>("idle");
  const [selected, setSelected] = useState<number | null>(null);
  const [scores, setScores]     = useState<number[]>([]);
  const [done, setDone]         = useState(false);
  const [totalAdded, setTotalAdded] = useState<number | null>(null);

  const q = questions[qIdx];

  function answer(opt: number) {
    if (answered !== "idle") return;
    setSelected(opt);
    const correct = opt === q.kcal;
    setAnswered(correct ? "correct" : "wrong");
    setScores(s => [...s, correct ? POINTS_CORRECT : 0]);
  }

  function next() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) {
      const total = [...scores].reduce((a, b) => a + b, 0);
      setDone(true);
      submitPoints(total).then(() => setTotalAdded(total)).catch(() => setTotalAdded(total));
    } else {
      setQIdx(nextIdx);
      setAnswered("idle");
      setSelected(null);
    }
  }

  if (done) {
    const total = scores.reduce((a, b) => a + b, 0);
    const maxPossible = questions.length * POINTS_CORRECT;
    const correct = scores.filter(s => s > 0).length;
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8">
          <Link href="/oyna" className="text-white/60 text-sm mb-6 block hover:text-white/90">← Oyunlara Dön</Link>
          <div className="text-center mb-8">
            <span className="text-5xl block mb-3">
              {total >= maxPossible * 0.8 ? "🔥" : total >= maxPossible * 0.5 ? "💪" : "🎯"}
            </span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Quiz Bitti!</h1>
            <p className="text-white/60 text-sm">10 sorudan {correct} doğru</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center mb-6">
            <p className="text-5xl font-extrabold text-white mb-1">{total}</p>
            <p className="text-white/60 text-sm">/ {maxPossible} puan</p>
            {totalAdded !== null && totalAdded > 0 && (
              <p className="mt-3 text-pink-300 font-bold text-sm">+{totalAdded} puan hesabına eklendi 🎉</p>
            )}
          </div>
          <div className="space-y-2 mb-8">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 bg-white/8 rounded-xl p-3">
                <span className="text-base flex-shrink-0">{scores[i] > 0 ? "✅" : "❌"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{q.title}</p>
                  <p className="text-white/50 text-xs">{q.kcal} kcal</p>
                </div>
                <span className="text-white/60 text-sm font-bold flex-shrink-0">{scores[i] ?? 0} pt</span>
              </div>
            ))}
          </div>
          <Link href="/oyna/quiz-kalori"
            className="block w-full py-3.5 bg-white/20 hover:bg-white/30 border border-white/25 rounded-2xl text-white font-bold text-center transition-colors">
            Yeni Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/oyna" className="text-white/60 text-sm hover:text-white/90">← Geri</Link>
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < qIdx ? "bg-pink-400" : i === qIdx ? "bg-white" : "bg-white/20"
              }`} />
            ))}
          </div>
          <span className="text-white/60 text-sm font-semibold">{qIdx + 1}/{questions.length}</span>
        </div>

        {/* Puan */}
        <div className="text-center mb-4">
          <span className="inline-block bg-white/15 border border-white/25 rounded-full px-3 py-1 text-white text-xs font-bold">
            Doğru = {POINTS_CORRECT} puan 🔥
          </span>
        </div>

        {/* Görsel — NET */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 flex-shrink-0">
          <img src={q.image_url} alt={q.title} className="w-full h-full object-cover" />
          {/* Yemek adı overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-extrabold text-lg leading-tight">{q.title}</p>
            <p className="text-white/60 text-xs mt-0.5">1 porsiyon</p>
          </div>
          {answered !== "idle" && (
            <div className={`absolute inset-0 flex items-center justify-center ${answered === "correct" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              <span className="text-5xl">{answered === "correct" ? "✅" : "❌"}</span>
            </div>
          )}
        </div>

        {/* Soru */}
        <p className="text-center text-white/70 text-sm font-semibold mb-4">Kaç kalori?</p>

        {/* Seçenekler */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {q.options.map(opt => {
            const isCorrect = opt === q.kcal;
            const isSelected = opt === selected;
            let cls = "rounded-xl px-3 py-4 text-sm font-bold text-center transition-all border-2 ";
            if (answered === "idle") {
              cls += "bg-white/12 border-white/20 text-white hover:bg-white/22 hover:border-white/40";
            } else if (isCorrect) {
              cls += "bg-emerald-500/30 border-emerald-400 text-white";
            } else if (isSelected) {
              cls += "bg-red-500/30 border-red-400 text-white";
            } else {
              cls += "bg-white/6 border-white/10 text-white/40";
            }
            return (
              <button key={opt} onClick={() => answer(opt)} disabled={answered !== "idle"} className={cls}>
                {opt} kcal
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
