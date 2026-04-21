"use client";

import { useState } from "react";

interface Props {
  title: string;
  url?: string;
  compact?: boolean;
}

export default function ShareButton({ title, url, compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url ?? window.location.href;

    // Web Share API — mobilde native paylaşım menüsünü açar
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // kullanıcı iptal etti
        return;
      }
    }

    // Masaüstü fallback — URL'yi kopyala
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        title={copied ? "Kopyalandı!" : "Paylaş"}
        className="flex items-center justify-center w-7 h-7 rounded-full border border-warm-200 bg-white text-warm-400 hover:border-brand-300 hover:text-brand-600 transition-colors"
      >
        {copied ? (
          <span className="text-[10px] font-bold text-brand-600">✓</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warm-200 bg-white text-warm-500 text-[13px] hover:border-brand-300 hover:text-brand-600 transition-colors"
    >
      {/* Paylaş ikonu */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Kopyalandı ✓" : "Paylaş"}
    </button>
  );
}
