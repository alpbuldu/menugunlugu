import { createAdminClient } from "@/lib/supabase/server";
import AdSenseUnit, { type AdSlotKey } from "./AdSenseUnit";

interface Props {
  placement: string;
  adSenseSlot?: AdSlotKey;
  className?: string;
  imageHeight?: string; // Tailwind sınıfı: "h-[100px]"
  adWidth?: string;     // AdSense genişlik: "100%", "728px"
  adHeight?: string;    // AdSense yükseklik: "100px", "80px"
}

/**
 * Reklam alanı — global toggle (site_settings.adsense_enabled) kapalıysa HİÇBİR ŞEY göstermez.
 * Açıksa: önce custom reklam, yoksa AdSense.
 */
export default async function AdSlot({
  placement,
  adSenseSlot,
  className = "",
  imageHeight = "",
  adWidth,
  adHeight,
}: Props) {
  const supabase = createAdminClient();

  const [{ data: ad }, { data: settings }] = await Promise.all([
    supabase
      .from("ads")
      .select("image_url, link_url, title")
      .eq("placement", placement)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("site_settings")
      .select("adsense_enabled")
      .eq("id", 1)
      .single(),
  ]);

  // Global reklam kapalıysa hiçbir şey gösterme
  if (!settings?.adsense_enabled) return null;

  // Özel reklam aktifse onu göster
  if (ad) {
    return (
      <div className={className}>
        <p className="text-[10px] text-warm-300 mb-1 text-right tracking-wide">Reklam</p>
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block rounded-xl overflow-hidden border border-warm-100 hover:opacity-90 transition-opacity ${imageHeight}`}
        >
          <img
            src={ad.image_url}
            alt={ad.title ?? "Reklam"}
            className="w-full h-full object-cover"
          />
        </a>
      </div>
    );
  }

  // Custom reklam yoksa AdSense göster (slot tanımlıysa)
  if (adSenseSlot) {
    return (
      <AdSenseUnit
        slot={adSenseSlot}
        className={className}
        width={adWidth}
        height={adHeight}
      />
    );
  }

  return null;
}
