"use client";

import { useEffect, useState } from "react";

interface Props {
  popup: { image_url: string; link_url: string };
}

const STORAGE_KEY = "site_popup_dismissed_at";
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 saat

export default function SitePopup({ popup }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed && Date.now() - Number(dismissed) < COOLDOWN_MS) return;
    } catch {}
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
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
        {popup.link_url ? (
          <a href={popup.link_url} target="_blank" rel="noopener noreferrer" onClick={close}>
            <img src={popup.image_url} alt="Duyuru" className="w-full block" />
          </a>
        ) : (
          <img src={popup.image_url} alt="Duyuru" className="w-full block" />
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
