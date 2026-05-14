"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useState } from "react";

const GA_ID = "G-69LK11MP4Q";

export default function ConsentScripts() {
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(null);

  useEffect(() => {
    // İlk yükleme
    const stored = localStorage.getItem("cookie-consent") as "accepted" | "rejected" | null;
    setConsent(stored);

    // Banner'dan gelen değişiklikleri dinle
    function onStorage(e: StorageEvent) {
      if (e.key === "cookie-consent") {
        setConsent(e.newValue as "accepted" | "rejected" | null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
