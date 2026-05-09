"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Food { id: string; title: string; slug: string; image_url: string; kcal_per_person: number }
interface Question { id: string; title: string; image_url: string; kcal: number; options: number[] }
type Phase = "category" | "loading" | "game" | "result";
type AnswerState = "idle" | "correct" | "wrong";

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

function generateOptions(correct: number): number[] {
  const range = correct > 500 ? 200 : correct > 250 ? 100 : 60;
  const step  = correct > 400 ? 25 : 10;
  const wrong = new Set<number>();
  let tries = 0;
  while (wrong.size < 3 && tries < 200) {
    tries++;
    const delta = (Math.floor(Math.random() * (range / step)) + 1) * step;
    const sign  = Math.random() < 0.5 ? 1 : -1;
    const v = Math.round((correct + sign * delta) / step) * step;
    if (v !== correct && v > 0 && v < 3000) wrong.add(v);
  }
  return shuffle([correct, ...Array.from(wrong)]);
}

async function submitPoints(pts: number) {
  if (pts <= 0) return;
  try {
    await fetch("/api/oyun/puan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ points: pts }) });
  } catch { /* ignore */ }
}

export default function QuizKaloriGame() {
  const [phase, setPhase]             = useState<Phase>("category");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subcatCounts, setSubcatCounts] = useState<Record<string, number>>({});
  const [selLabel, setSelLabel]       = useState("");

  // game state
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [qIdx, setQIdx]             = useState(0);
  const [answered, setAnswered]     = useState<AnswerState>("idle");
  const [selected, setSelected]     = useState<number | null>(null);
  const [scores, setScores]         = useState<number[]>([]);
  const [totalAdded, setTotalAdded] = useState<number | null>(null);

  const supabase = createClient();

  // Auto-advance 2s after answering
  useEffect(() => {
    if (answered === "idle") return;
    const timer = setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= questions.length) {
        setPhase("result");
      } else {
        setQIdx(nextIdx);
        setAnswered("idle");
        setSelected(null);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [answered, qIdx, questions.length]);

  async function loadSubcatCounts(catKey: string) {
    const { data } = await supabase.from("recipes").select("subcategories")
      .eq("category", catKey).eq("approval_status", "approved")
      .not("image_url", "is", null).not("kcal_per_person", "is", null).gt("kcal_per_person", 0);
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
    setSelLabel(CATS.find(c => c.key === key)?.label ?? "");
    const { data } = await supabase.from("recipes").select("id, title, slug, image_url, kcal_per_person")
      .eq("category", key).eq("approval_status", "approved")
      .not("image_url", "is", null).not("kcal_per_person", "is", null).gt("kcal_per_person", 0);
    if (!data || data.length < MIN_RECIPES) { setPhase("category"); return; }
    startGame(data as Food[]);
  }

  async function pickSubcat(catKey: string, subcat: string) {
    setPhase("loading");
    setSelLabel(subcat);
    const { data } = await supabase.from("recipes").select("id, title, slug, image_url, kcal_per_person, subcategories")
      .eq("category", catKey).eq("approval_status", "approved")
      .not("image_url", "is", null).not("kcal_per_person", "is", null).gt("kcal_per_person", 0);
    if (!data || data.length < MIN_RECIPES) { setPhase("category"); return; }
    const subcatPool = (data as any[]).filter(r => (r.subcategories ?? []).includes(subcat));
    if (subcatPool.length < MIN_RECIPES) { setPhase("category"); return; }
    startGame(subcatPool as Food[]);
  }

  function startGame(pool: Food[]) {
    const qs = shuffle(pool).slice(0, 10).map(r => ({
      id: r.id,
      title: r.title,
      image_url: r.image_url,
      kcal: r.kcal_per_person,
      options: generateOptions(r.kcal_per_person),
    }));
    setQuestions(qs);
    setQIdx(0);
    setAnswered("idle");
    setSelected(null);
    setScores([]);
    setTotalAdded(null);
    setPhase("game");
  }

  function restart() {
    setPhase("category");
    setQuestions([]); setQIdx(0);
    setAnswered("idle"); setSelected(null);
    setScores([]); setTotalAdded(null); setExpandedCat(null); setSelLabel("");
  }

  function handleShare() {
    const correctCount = scores.filter(s => s > 0).length;
    const pct = Math.round((correctCount / questions.length) * 100);
    const catLine = selLabel ? `${selLabel} kategorisinde ` : "";
    const text = `🔥 Menü Günlüğü Kalori Quiz'de ${catLine}${correctCount}/${questions.length} doğru bildim! (%${pct})\nSen kaç yaparsın?\nmenugunlugu.com`;
    if (typeof navigator !== "undefined" && navigator.share) navigator.share({ text }).catch(() => {});
    else if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text);
  }

  /* ── CATEGORY ── */
  if (phase === "category") {
    const expandedObj = CATS.find(c => c.key === expandedCat);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/oyna" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div className="text-center flex-1 mx-4">
              <p className="font-bold text-white">Kalori Quiz 🔥</p>
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
    <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex items-center justify-center flex-col gap-3">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Sorular hazırlanıyor…</p>
    </div>
  );

  /* ── RESULT ── */
  if (phase === "result") {
    const total = scores.reduce((a, b) => a + b, 0);
    const correctCount = scores.filter(s => s > 0).length;
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8">
          <div className="text-center mb-6">
            <span className="text-5xl block mb-3">
              {correctCount >= 8 ? "🔥" : correctCount >= 5 ? "💪" : "🎯"}
            </span>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-5xl font-extrabold text-white">{correctCount}</span>
              <span className="text-2xl font-bold text-white/50">/{questions.length}</span>
            </div>
            <p className="text-white/60 text-sm">%{pct} doğru</p>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center">
              {totalAdded !== null && totalAdded > 0
                ? <p className="text-pink-300 font-bold text-sm">+{totalAdded} puan hesabınıza eklendi 🎉</p>
                : <p className="text-white/50 text-sm">Oynayarak puan kazan!</p>
              }
            </div>
            <button onClick={handleShare}
              className="flex-shrink-0 bg-[#9A3A5A] hover:bg-[#7A2A45] border border-white/25 rounded-2xl px-4 py-4 text-white font-bold text-sm transition-colors">
              Paylaş
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2 bg-white/8 rounded-xl p-2.5">
                <span className="text-sm flex-shrink-0">{scores[i] > 0 ? "✅" : "❌"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{q.title}</p>
                  <p className="text-white/50 text-[10px]">{q.kcal} kcal</p>
                </div>
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
  const q = questions[qIdx];
  if (!q) return null;

  function answer(opt: number) {
    if (answered !== "idle") return;
    setSelected(opt);
    const correct = opt === q.kcal;
    setAnswered(correct ? "correct" : "wrong");
    const earned = correct ? 1 : 0;
    const newScores = [...scores, earned];
    setScores(newScores);
    if (qIdx + 1 >= questions.length) {
      const total = newScores.reduce((a, b) => a + b, 0);
      submitPoints(total).then(() => setTotalAdded(total)).catch(() => setTotalAdded(total));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9A3A5A] to-[#3A0A1A] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <button onClick={restart} className="text-white/60 text-sm hover:text-white/90">← Geri</button>
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < qIdx ? "bg-pink-400" : i === qIdx ? "bg-white" : "bg-white/20"
              }`} />
            ))}
          </div>
          <span className="text-white/60 text-sm font-semibold">{qIdx + 1}/{questions.length}</span>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 flex-shrink-0">
          <img src={q.image_url} alt={q.title} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-extrabold text-lg leading-tight">{q.title}</p>
            <p className="text-white/60 text-xs mt-0.5">1 porsiyon</p>
          </div>
          {answered !== "idle" && (
            <div className={`absolute inset-0 flex items-center justify-center ${answered === "correct" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              <span className="text-5xl">{answered === "correct" ? "✅" : "❌"}</span>
            </div>
          )}
          {answered !== "idle" && (
            <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
              <span className="text-white/70 text-xs">Sonraki soru…</span>
            </div>
          )}
        </div>

        <p className="text-center text-white/70 text-sm font-semibold mb-4">Kaç kalori?</p>

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
      </div>
    </div>
  );
}
