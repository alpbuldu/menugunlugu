import { createAdminClient } from "@/lib/supabase/server";

interface Ad {
  image_url: string;
  link_url: string;
  title: string | null;
}

function SidebarAd({ ad, side }: { ad: Ad; side: "left" | "right" }) {
  return (
    <div>
      <p className={`text-[10px] text-warm-300 mb-1 tracking-wide ${side === "right" ? "text-left" : "text-right"}`}>
        Reklam
      </p>
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-xl overflow-hidden border border-warm-100 hover:opacity-90 transition-opacity"
      >
        <img
          src={ad.image_url}
          alt={ad.title ?? "Reklam"}
          className="w-full object-cover"
        />
      </a>
    </div>
  );
}

// contentWidth'e göre hangi breakpoint ve konumda gösterileceği:
// "narrow"  → max-w-3xl (768px) sayfalar  → xl (1280px) yeterli
// "wide"    → max-w-[1100px] sayfalar     → 1440px gerekli
// "wider"   → max-w-[1200px] sayfalar     → 1520px gerekli

type ContentWidth = "narrow" | "wide" | "wider";

const CONFIG: Record<ContentWidth, { blockClass: string; leftClass: string; rightClass: string; adWidth: string }> = {
  narrow: {
    blockClass: "hidden xl:block",
    leftClass:  "left-4",
    rightClass: "right-4",
    adWidth:    "w-[160px]",
  },
  wide: {
    blockClass: "hidden [@media(min-width:1440px)]:block",
    leftClass:  "left-3",
    rightClass: "right-3",
    adWidth:    "w-[155px]",
  },
  wider: {
    blockClass: "hidden [@media(min-width:1520px)]:block",
    leftClass:  "left-2",
    rightClass: "right-2",
    adWidth:    "w-[150px]",
  },
};

export default async function SidebarLayout({
  children,
  placement,
  contentWidth = "wide",
}: {
  children: React.ReactNode;
  placement: string;
  contentWidth?: ContentWidth;
}) {
  const supabase = createAdminClient();
  const { data: ad } = await supabase
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cfg = CONFIG[contentWidth];

  return (
    <div className="relative">
      {ad && (
        <>
          <div className={`${cfg.blockClass} absolute ${cfg.leftClass} top-10 ${cfg.adWidth}`}>
            <SidebarAd ad={ad} side="left" />
          </div>
          <div className={`${cfg.blockClass} absolute ${cfg.rightClass} top-10 ${cfg.adWidth}`}>
            <SidebarAd ad={ad} side="right" />
          </div>
        </>
      )}
      {children}
    </div>
  );
}
