"use client";

import { useEffect, useRef } from "react";

// Tüm AdSense slot ID'leri
export const AD_SLOTS = {
  // Anasayfa
  anasayfa_banner:          "4371716814",
  anasayfa_sponsorlu_kart:  "9860988857",
  anasayfa_popup:           "4615259395",

  // Günün Menüsü
  gunun_menusu_yatay:       "8362932712",
  gunun_menusu_dikey:       "5059568795",

  // Dünün Menüsü
  dunun_menusu_yatay:       "6935442613",
  dunun_menusu_dikey:       "7652486277",

  // Tarifler Listesi
  tarifler_yatay_masaustu:  "3167902620",
  tarifler_yatay_mobil:     "9334375240",
  tarifler_dikey_masaustu:  "1854820958",

  // Tarif Detayı
  tarif_detay_yatay_masaustu: "6614736777",
  tarif_detay_yatay_mobil:    "4082048566",
  tarif_detay_dikey_masaustu: "5301655109",

  // Blog Listesi
  blog_yatay_masaustu:      "1455885223",
  blog_yatay_mobil:         "8228657619",
  blog_dikey_masaustu:      "1087077929",

  // Blog Yazısı Detayı
  blog_yazisi_yatay_masaustu: "1362410090",
  blog_yazisi_yatay_mobil:    "6147832919",
  blog_yazisi_dikey_masaustu: "4834751240",

  // Menü Oluştur
  menu_olustur_dikey:       "4867997102",
  menu_olustur_yatay:       "4289412602",
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

interface Props {
  slot: AdSlotKey;
  className?: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
}

export default function AdSenseUnit({ slot, className = "", format = "auto" }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // AdSense henüz yüklenmemiş olabilir
    }
  }, []);

  return (
    <div className={className}>
      <p className="text-[10px] text-warm-300 mb-1 text-right tracking-wide">Reklam</p>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8588576330436541"
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
