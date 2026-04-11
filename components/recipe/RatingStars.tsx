"use client";

import { useState, useEffect } from "react";

interface Props { recipeId: string; }

export default function RatingStars({ recipeId }: Props) {
  const [avg,       setAvg]       = useState(0);
  const [count,     setCount]     = useState(0);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hover,     setHover]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [message,   setMessage]   = useState("");

  useEffect(() => {
    fetch(`/api/recipes/${recipeId}/ratings`)
      .then((r) => r.json())
      .then((d) => { setAvg(d.avg); setCount(d.count); setUserScore(d.userScore); })
      .finally(() => setLoading(false));
  }, [recipeId]);

  async function handleRate(score: number) {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/recipes/${recipeId}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Hata oluştu.");
      return;
    }
    setUserScore(score);
    // Optimistically update avg
    setMessage("Puanınız kaydedildi ✓");
    // Re-fetch for accurate avg
    fetch(`/api/recipes/${recipeId}/ratings`)
      .then((r) => r.json())
      .then((d) => { setAvg(d.avg); setCount(d.count); });
  }

  if (loading) return <div className="h-8 w-32 bg-warm-100 rounded animate-pulse" />;

  const display = hover || userScore || 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={saving}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-2xl leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
              title={`${star} yıldız`}
            >
              <span className={
                star <= (display || avg)
                  ? "text-yellow-400"
                  : "text-warm-200"
              }>★</span>
            </button>
          ))}
        </div>

        {/* Score + count */}
        <div className="text-sm text-warm-500">
          {count > 0 && (
            <span><strong className="text-warm-800">{avg.toFixed(1)}</strong> ({count} değerlendirme)</span>
          )}
        </div>
      </div>

      {message && (
        <p className="text-xs text-brand-600">{message}</p>
      )}
      {!userScore && !message && (
        <p className="text-xs text-warm-400">Bu tarifi puanlamak için bir yıldıza tıklayın</p>
      )}
    </div>
  );
}
