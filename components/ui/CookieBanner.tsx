"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-warm-900/95 backdrop-blur-sm border-t border-warm-700 px-4 py-2.5">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3">
        {/* Mobil: kısa */}
        <p className="sm:hidden text-xs text-warm-400 leading-snug">
          Bu site deneyiminizi iyileştirmek için çerez kullanır.{" "}
          <Link href="/gizlilik-politikasi" className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
            Gizlilik Politikamızı
          </Link>{" "}
          inceleyebilirsiniz.
        </p>
        {/* Desktop: uzun */}
        <p className="hidden sm:block text-sm text-warm-300 leading-relaxed">
          Bu site, deneyiminizi iyileştirmek ve analitik amaçlarla çerez kullanmaktadır.
          Siteyi kullanmaya devam ederek{" "}
          <Link href="/gizlilik-politikasi" className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
            Gizlilik Politikamızı
          </Link>{" "}
          kabul etmiş sayılırsınız.
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
