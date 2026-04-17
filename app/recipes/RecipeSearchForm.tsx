"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

interface Props {
  initialQ: string;
  initialAuthorQ: string;
  category?: string;
}

function CloseIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function RecipeSearchForm({ initialQ, initialAuthorQ, category }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [authorQ, setAuthorQ] = useState(initialAuthorQ);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function navigate(newQ: string, newAuthorQ: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (category) p.set("category", category);
      if (newQ.trim()) p.set("q", newQ.trim());
      if (newAuthorQ.trim()) p.set("authorQ", newAuthorQ.trim());
      router.push(`/recipes${p.toString() ? `?${p}` : ""}`);
    }, 350);
  }

  function handleQ(v: string) { setQ(v); navigate(v, authorQ); }
  function handleAuthorQ(v: string) { setAuthorQ(v); navigate(q, v); }

  return (
    <div className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <input
          type="text"
          value={q}
          onChange={(e) => handleQ(e.target.value)}
          placeholder="Tarif ara..."
          className="w-full text-sm pl-3.5 pr-8 py-2.5 rounded-xl border border-warm-200 bg-white focus:outline-none focus:border-brand-400 text-warm-800 placeholder:text-warm-400"
        />
        {q && (
          <button
            type="button"
            onClick={() => handleQ("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
            aria-label="Aramayı temizle"
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <div className="relative flex-1">
        <input
          type="text"
          value={authorQ}
          onChange={(e) => handleAuthorQ(e.target.value)}
          placeholder="Yazar ara..."
          className="w-full text-sm pl-3.5 pr-8 py-2.5 rounded-xl border border-warm-200 bg-white focus:outline-none focus:border-brand-400 text-warm-800 placeholder:text-warm-400"
        />
        {authorQ && (
          <button
            type="button"
            onClick={() => handleAuthorQ("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
            aria-label="Aramayı temizle"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
