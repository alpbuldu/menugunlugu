"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { LeaderEntry } from "./page";
import PageHeader from "@/components/ui/PageHeader";

const GAMES = [
  {
    key: "kor-siralama",
    title: "Kör Sıralama",
    desc: "Yemekleri görmeden sezgine güven. En iyi listeyi yapabilecek misin?",
    emoji: "🙈",
    gradient: "from-[#7A4A8A] to-[#4A2260]",
    href: "/oyna/kor-siralama",
    playText: "Sırala",
    pointText: "+1 puan kazan",
    wide: false,
  },
  {
    key: "turnuva",
    title: "Turnuva",
    desc: "Favori yemeklerini kapıştır. Tur tur ilerle, tek şampiyon kalsın.",
    emoji: "🏆",
    gradient: "from-[#C8922A] to-[#8B6010]",
    href: "/oyna/turnuva",
    playText: "Mücadeleye Başla",
    pointText: "+1 puan kazan",
    wide: false,
  },
  {
    key: "omubumu",
    title: "O mu Bu mu?",
    desc: "İki yemek arasında kal, içgüdünle seç. Seçimlerinle en sevilen lezzetleri ortaya çıkar.",
    emoji: "🤔",
    gradient: "from-[#E07A2F] to-[#B05018]",
    href: "/omubumu",
    playText: "Seçmeye Başla",
    pointText: "+1 puan kazan",
    wide: true,
  },
  {
    key: "quiz",
    title: "Quiz — Yemeği Tahmin Et",
    desc: "Görsel bulanık, ipuçları sınırlı. Yemeği tahmin edebilecek misin?",
    emoji: "❓",
    gradient: "from-[#3A6B6B] to-[#1F3D3D]",
    href: "/oyna/quiz",
    playText: "Tahmin Et",
    pointText: "+10'a kadar puan",
    wide: false,
  },
  {
    key: "quiz-kalori",
    title: "Quiz — Kalorisini Tahmin Et",
    desc: "Yemeği görüyorsun ama kaç kalori? Sezgin ne kadar güçlü?",
    emoji: "🔥",
    gradient: "from-[#9A3A5A] to-[#6A1A3A]",
    href: "/oyna/quiz-kalori",
    playText: "Tahmin Et",
    pointText: "+10'a kadar puan",
    wide: false,
  },
] as const;

function GameCard({ game }: { game: typeof GAMES[number] }) {
  return (
    <Link href={game.href}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} flex flex-col p-4 sm:p-5 min-h-[160px] sm:min-h-[180px] group transition-transform hover:-translate-y-0.5 hover:shadow-xl`}>
      {/* Watermark emoji */}
      <span className="absolute -bottom-3 -right-2 text-[80px] sm:text-[90px] opacity-25 select-none pointer-events-none leading-none">
        {game.emoji}
      </span>
      {/* Top: play badge + point hint */}
      <div className="flex flex-col gap-1.5 mb-auto">
        <span className="self-start inline-flex items-center gap-1.5 bg-white/20 border border-white/25 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
          {game.playText} →
        </span>
        <span className="text-[10px] font-semibold text-white/55">{game.pointText}</span>
      </div>
      {/* Bottom: title + desc */}
      <div className="mt-4 relative z-10">
        <p className="text-base sm:text-lg font-extrabold text-white leading-tight mb-1">{game.title}</p>
        <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed line-clamp-3">{game.desc}</p>
      </div>
    </Link>
  );
}

function LeaderRow({ entry, rank, currentUserId }: { entry: LeaderEntry; rank: number; currentUserId: string | null }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const isMe = entry.user_id === currentUserId;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 h-full ${rank === 1 ? "bg-brand-50/40" : ""}`}>
      <div className="w-7 text-center flex-shrink-0">
        {medal
          ? <span className="text-xl">{medal}</span>
          : <span className="text-sm font-bold text-warm-400">{rank}</span>}
      </div>
      <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-sm">
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          : "🍽️"}
      </div>
      <p className="flex-1 text-sm font-semibold text-warm-800 truncate">
        {entry.username ?? "Misafir"}
        {isMe && <span className="ml-1.5 text-[10px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full">sen</span>}
      </p>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-extrabold text-brand-600 leading-none">{entry.total_points}</p>
        <p className="text-[9px] text-warm-400 font-medium">puan</p>
      </div>
    </div>
  );
}

export default function OynaClient({ leaderboard }: { leaderboard: LeaderEntry[] }) {
  const [userId, setUserId]           = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase.from("user_points").select("total_points").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setTotalPoints(data?.total_points ?? 0));
    });
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        <PageHeader
          title="Oyna"
          description="Yemek dünyasına özel eğlenceli mini oyunlar, testler ve etkileşimli içeriklerle vakit geçir."
          emoji="🎮"
        />

        {/* Game grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Row 1: Kör Sıralama + Turnuva */}
          <GameCard game={GAMES[0]} />
          <GameCard game={GAMES[1]} />
          {/* Row 2: O mu Bu mu — full width */}
          <div className="col-span-2">
            <GameCard game={GAMES[2]} />
          </div>
          {/* Row 3: Quiz ikisi */}
          <GameCard game={GAMES[3]} />
          <GameCard game={GAMES[4]} />
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-warm-100">
              <span className="text-base">🏆</span>
              <h2 className="text-sm font-extrabold text-warm-900">Puan Tablosu</h2>
              <div className="ml-auto flex items-center gap-2">
                {totalPoints !== null && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1">
                    Puanın: {totalPoints}
                  </span>
                )}
                {totalPoints === null && userId === null && (
                  <Link href="/giris" className="text-xs font-semibold text-brand-600 hover:underline">
                    Giriş yap → puan kazan
                  </Link>
                )}
              </div>
            </div>
            <div className="sm:grid sm:grid-cols-2">
              {leaderboard.map((entry, i) => {
                const isLastRow = i >= leaderboard.length - (leaderboard.length % 2 === 0 ? 2 : 1);
                return (
                  <div key={entry.user_id} className={[
                    "border-b border-warm-50",
                    i === leaderboard.length - 1 ? "border-b-0" : "",
                    isLastRow ? "sm:border-b-0" : "",
                    i % 2 === 0 ? "sm:border-r sm:border-warm-50" : "",
                  ].join(" ")}>
                    <LeaderRow entry={entry} rank={i + 1} currentUserId={userId} />
                  </div>
                );
              })}
            </div>
            {!userId && (
              <div className="flex items-center gap-2 px-4 py-3 bg-brand-50/50 border-t border-warm-100">
                <span className="text-sm">🔒</span>
                <p className="text-xs font-semibold text-brand-700 flex-1">
                  Üye olmadan oynayabilirsin —{" "}
                  <Link href="/giris" className="underline">giriş yap</Link>{" "}
                  veya{" "}
                  <Link href="/giris" className="underline">kayıt ol</Link>{" "}
                  puan kazanmak için.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
