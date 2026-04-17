"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props { recipeId: string; }

export default function FavoriteButton({ recipeId }: Props) {
  const [favorited, setFavorited] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/recipes/${recipeId}/favorites`)
      .then((r) => r.json())
      .then((d) => setFavorited(d.favorited))
      .finally(() => setLoading(false));
  }, [recipeId]);

  // Aynı sayfadaki diğer FavoriteButton örneklerini dinle
  useEffect(() => {
    function onSync(e: Event) {
      const { recipeId: id, favorited: val } = (e as CustomEvent).detail;
      if (id === recipeId) setFavorited(val);
    }
    window.addEventListener("favorite-changed", onSync);
    return () => window.removeEventListener("favorite-changed", onSync);
  }, [recipeId]);

  async function toggle() {
    setSaving(true);
    const res  = await fetch(`/api/recipes/${recipeId}/favorites`, { method: "POST" });
    const data = await res.json();
    setSaving(false);

    if (res.status === 401) {
      router.push("/giris");
      return;
    }
    if (res.ok) {
      setFavorited(data.favorited);
      // Sayfadaki diğer örnekleri güncelle
      window.dispatchEvent(new CustomEvent("favorite-changed", {
        detail: { recipeId, favorited: data.favorited },
      }));
    }
  }

  if (loading) return <div className="w-10 h-10 rounded-full bg-warm-100 animate-pulse" />;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={favorited ? "Tarif Defterinden çıkar" : "Tarif Defterine ekle"}
      className={[
        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
        favorited
          ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
          : "bg-white border-warm-200 text-warm-500 hover:bg-warm-50 hover:text-red-400 hover:border-red-200",
        saving ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span className="text-base leading-none">{favorited ? "❤️" : "🤍"}</span>
      <span>{favorited ? "Tarif Defterinde" : "Tarif Defterine Ekle"}</span>
    </button>
  );
}
