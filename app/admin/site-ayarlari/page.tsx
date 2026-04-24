import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "./SiteSettingsForm";
import PopupSettings from "./PopupSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Site Ayarları" };
export const dynamic = "force-dynamic";

const PAGE_ORDER = [
  "home", "gunun_menusu", "dunun_menusu", "tarifler",
  "tarif_detay", "blog", "blog_yazisi", "menu_olustur",
];

export default async function SiteAyarlariPage() {
  const supabase = await createClient();

  const [{ data: settingsData }, { data: popupsData }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("logo_url, favicon_url, contact_email, instagram_url, youtube_url, tiktok_url, twitter_url, adsense_enabled")
      .eq("id", 1)
      .single(),
    supabase
      .from("page_popups")
      .select("page, image_url, link_url, is_active"),
  ]);

  const settings = settingsData ?? {
    logo_url: null, favicon_url: null, contact_email: null,
    instagram_url: null, youtube_url: null, tiktok_url: null,
    twitter_url: null, adsense_enabled: false,
  };

  // Sıralı popup listesi — DB'de kayıt yoksa boş defaults
  const popupMap = Object.fromEntries((popupsData ?? []).map((p) => [p.page, p]));
  const popups = PAGE_ORDER.map((page) => popupMap[page] ?? {
    page, image_url: null, link_url: null, is_active: false,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-warm-900 mb-1">Site Ayarları</h1>
      <p className="text-warm-500 text-sm mb-8">Logo, iletişim ve sosyal medya bilgilerini buradan güncelleyin.</p>
      <div className="max-w-2xl space-y-8">
        <SiteSettingsForm settings={settings} />
        <PopupSettings popups={popups} />
      </div>
    </div>
  );
}
