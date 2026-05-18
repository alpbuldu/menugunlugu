"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const IOS_URL = "https://apps.apple.com/us/app/men%C3%BC-g%C3%BCnl%C3%BC%C4%9F%C3%BC/id6769045551";
const ANDROID_URL: string | null = null; // Play Store yayına girince ekle

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

export default function AppDownloadClient() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // iOS → doğrudan App Store'a yönlendir
    if (p === "ios") {
      setRedirecting(true);
      window.location.href = IOS_URL;
      return;
    }

    // Android → Play Store varsa yönlendir, yoksa sayfada kal
    if (p === "android" && ANDROID_URL) {
      setRedirecting(true);
      window.location.href = ANDROID_URL;
      return;
    }
  }, []);

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-6xl">🍽️</span>
        <h1 className="text-3xl font-bold text-warm-900">Menü Günlüğü</h1>
        <p className="text-warm-500 text-center max-w-xs">
          Her gün yeni bir menü. Her sofraya yeni bir fikir.
        </p>
      </div>

      {/* Yönlendirme mesajı */}
      {redirecting && (
        <div className="mb-6 flex items-center gap-2 text-brand-600 font-medium">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Mağazaya yönlendiriliyorsunuz...
        </div>
      )}

      {/* Butonlar */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* App Store */}
        <a
          href={IOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all shadow-md ${
            platform === "ios"
              ? "bg-black text-white scale-105 shadow-lg ring-2 ring-brand-500"
              : "bg-black text-white hover:scale-105 hover:shadow-lg"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div>
            <div className="text-[11px] opacity-75 leading-tight">App Store'dan İndir</div>
            <div className="text-base font-bold leading-tight">iOS</div>
          </div>
          {platform === "ios" && (
            <span className="ml-auto text-xs bg-brand-500 rounded-full px-2 py-0.5 font-semibold">Senin cihazın</span>
          )}
        </a>

        {/* Play Store */}
        <div
          className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
            ANDROID_URL
              ? "bg-white shadow-md cursor-pointer hover:scale-105 hover:shadow-lg"
              : "bg-warm-100 opacity-60 cursor-not-allowed"
          } ${platform === "android" ? "ring-2 ring-brand-500 scale-105 shadow-lg" : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill={ANDROID_URL ? "#3DDC84" : "#9CA3AF"}>
            <path d="M17.523 15.341a.5.5 0 0 1-.848.35l-2.04-2.04a6.5 6.5 0 0 1-5.271 0l-2.04 2.04a.5.5 0 0 1-.848-.35V8.66a.5.5 0 0 1 .848-.35l2.04 2.04a6.5 6.5 0 0 1 5.271 0l2.04-2.04a.5.5 0 0 1 .848.35v6.68zM7.5 10a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm9 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM5 8.196l1.5-2.598A1 1 0 0 1 7.366 5h9.268a1 1 0 0 1 .866.598L19 8.196"/>
          </svg>
          <div>
            <div className={`text-[11px] leading-tight ${ANDROID_URL ? "text-warm-400" : "text-warm-400"}`}>
              {ANDROID_URL ? "Google Play'den İndir" : "Yakında Google Play'de"}
            </div>
            <div className={`text-base font-bold leading-tight ${ANDROID_URL ? "text-warm-900" : "text-warm-400"}`}>Android</div>
          </div>
          {platform === "android" && !ANDROID_URL && (
            <span className="ml-auto text-xs bg-warm-300 text-warm-700 rounded-full px-2 py-0.5 font-semibold">Yakında</span>
          )}
        </div>
      </div>

      {/* Web sitesi linki */}
      <div className="mt-8 text-center">
        <p className="text-sm text-warm-400 mb-2">Tarayıcıdan kullanmak ister misin?</p>
        <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
          menugunlugu.com'a git →
        </Link>
      </div>

      {/* Özellikler */}
      <div className="mt-10 grid grid-cols-3 gap-4 max-w-xs w-full text-center">
        {[
          { emoji: "🍽️", label: "Günlük Menü" },
          { emoji: "📖", label: "305+ Tarif" },
          { emoji: "🎮", label: "Oyunlar" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{f.emoji}</span>
            <span className="text-xs text-warm-500 font-medium">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
