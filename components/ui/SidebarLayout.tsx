import { createAdminClient } from "@/lib/supabase/server";
import AdSenseUnit, { type AdSlotKey } from "@/components/ui/AdSenseUnit";

interface Ad {
  image_url: string;
  link_url: string;
  title: string | null;
}

function SidebarAd({ ad, side }: { ad: Ad; side: "left" | "right" }) {
  return (
    <div className="flex flex-col h-full">
      <p className={`text-[10px] text-warm-300 mb-1 tracking-wide flex-shrink-0 ${side === "right" ? "text-left" : "text-right"}`}>
        Reklam
      </p>
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block flex-1 rounded-xl overflow-hidden border border-warm-100 hover:opacity-90 transition-opacity min-h-0"
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

const OUTER = "[@media(min-width:1440px)]:grid [@media(min-width:1440px)]:grid-cols-[200px_1fr_200px] [@media(min-width:1440px)]:gap-4";
const SIDE  = "hidden [@media(min-width:1440px)]:block pt-10 pb-16";
const LEFT_PAD  = "[@media(min-width:1440px)]:pl-3";
const RIGHT_PAD = "[@media(min-width:1440px)]:pr-3";

export default async function SidebarLayout({
  children,
  placement,
  adSenseSlot,
}: {
  children: React.ReactNode;
  placement: string;
  adSenseSlot?: AdSlotKey;
}) {
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
    supabase.from("site_settings").select("adsense_enabled").eq("id", 1).single(),
  ]);

  const adsenseEnabled = settings?.adsense_enabled === true;
  // Custom reklam yoksa, AdSense açıksa ve slot tanımlıysa AdSense göster
  const showAdsense = !ad && !!adSenseSlot && adsenseEnabled;

  if (!ad && !showAdsense) return <>{children}</>;

  return (
    <div className={OUTER}>
      {/* Sol sidebar */}
      <div className={`${SIDE} ${LEFT_PAD}`}>
        <div className="sticky top-20" style={{ height: "min(calc(100vh - 9rem), 100%)" }}>
          {ad ? (
            <SidebarAd ad={ad} side="left" />
          ) : (
            <AdSenseUnit slot={adSenseSlot!} />
          )}
        </div>
      </div>

      {/* İçerik */}
      {children}

      {/* Sağ sidebar */}
      <div className={`${SIDE} ${RIGHT_PAD}`}>
        <div className="sticky top-20" style={{ height: "min(calc(100vh - 9rem), 100%)" }}>
          {ad ? (
            <SidebarAd ad={ad} side="right" />
          ) : (
            <AdSenseUnit slot={adSenseSlot!} />
          )}
        </div>
      </div>
    </div>
  );
}
