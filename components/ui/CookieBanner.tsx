"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-warm-900/95 backdrop-blur-sm border-t border-warm-700 px-4 py-3">
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Metin */}
        <p className="text-xs sm:text-sm text-warm-300 leading-relaxed">
          Bu site, deneyiminizi iyileştirmek ve analitik amaçlarla çerez kullanmaktadır.{" "}
          <Link
            href="/gizlilik-politikasi"
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
          >
            Gizlilik Politikası
          </Link>
        </p>

        {/* Butonlar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="px-4 py-1.5 border border-warm-600 hover:border-warm-400 text-warm-400 hover:text-warm-200 text-xs font-medium rounded-lg transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={accept}
            className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
