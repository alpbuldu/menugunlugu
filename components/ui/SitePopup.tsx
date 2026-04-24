"use client";

import { useEffect, useState } from "react";

interface Props {
  imageUrl: string;
  linkUrl?: string | null;
  placement: string; // used for unique localStorage key per placement
}

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 saat

export default function SitePopup({ imageUrl, linkUrl, placement }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const storageKey = `popup_dismissed_${placement}`;
    try {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed && Date.now() - Number(dismissed) < COOLDOWN_MS) return;
    } catch {}
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [placement]);

  function close() {
    const storageKey = `popup_dismissed_${placement}`;
    setVisible(false);
    try { localStorage.setItem(storageKey, String(Date.now())); } catch {}
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup kutu */}
      <div
        className="relative z-10 max-w-sm w-full sm:max-w-md rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat butonu */}
        <button
          onClick={close}
          aria-label="Kapat"
          className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-lg leading-none"
        >
          ×
        </button>

        {/* Görsel */}
        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
            <img src={imageUrl} alt="Duyuru" className="w-full block" />
          </a>
        ) : (
          <img src={imageUrl} alt="Duyuru" className="w-full block" />
        )}

        {/* Alt bar */}
        <div className="bg-white px-3 py-1.5 flex items-center justify-end">
          <button
            onClick={close}
            className="text-xs text-warm-400 hover:text-warm-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
