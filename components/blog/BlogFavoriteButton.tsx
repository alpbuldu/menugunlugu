"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props { postId: string; compact?: boolean; }

export default function BlogFavoriteButton({ postId, compact = false }: Props) {
  const [favorited, setFavorited] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/blog/${postId}/favorites`)
      .then((r) => r.json())
      .then((d) => setFavorited(d.favorited))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    function onSync(e: Event) {
      const { postId: id, favorited: val } = (e as CustomEvent).detail;
      if (id === postId) setFavorited(val);
    }
    window.addEventListener("blog-favorite-changed", onSync);
    return () => window.removeEventListener("blog-favorite-changed", onSync);
  }, [postId]);

  async function toggle() {
    setSaving(true);
    const res  = await fetch(`/api/blog/${postId}/favorites`, { method: "POST" });
    const data = await res.json();
    setSaving(false);

    if (res.status === 401) {
      router.push(`/giris?from=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (res.ok) {
      setFavorited(data.favorited);
      window.dispatchEvent(new CustomEvent("blog-favorite-changed", {
        detail: { postId, favorited: data.favorited },
      }));
    }
  }

  if (loading) return <div className={compact ? "w-7 h-7 rounded-full bg-warm-100 animate-pulse" : "w-10 h-10 rounded-full bg-warm-100 animate-pulse"} />;

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={saving}
        title={favorited ? "Tarif Defterinden çıkar" : "Tarif Defterine ekle"}
        className={[
          "flex items-center justify-center w-7 h-7 rounded-full border transition-all",
          favorited
            ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
            : "bg-white border-warm-200 text-warm-400 hover:bg-warm-50 hover:text-red-400 hover:border-red-200",
          saving ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span className="text-sm leading-none">{favorited ? "❤️" : "🤍"}</span>
      </button>
    );
  }

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
      <span>{favorited ? "Defterinde" : "Deftere Ekle"}</span>
    </button>
  );
}
