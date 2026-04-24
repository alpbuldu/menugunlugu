import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "./SiteSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Site Ayarları" };
export const dynamic = "force-dynamic";

export default async function SiteAyarlariPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_url, favicon_url, contact_email, instagram_url, youtube_url, tiktok_url, twitter_url, adsense_enabled")
    .eq("id", 1)
    .single();

  const settings = data ?? {
    logo_url: null, favicon_url: null, contact_email: null,
    instagram_url: null, youtube_url: null, tiktok_url: null, twitter_url: null, adsense_enabled: false,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-warm-900 mb-1">Site Ayarları</h1>
      <p className="text-warm-500 text-sm mb-8">Logo, iletişim ve sosyal medya bilgilerini buradan güncelleyin.</p>
      <SiteSettingsForm settings={settings} />
    </div>
  );
}
