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

// contentWidth'e göre grid breakpoint ve sütun genişlikleri:
// narrow → max-w-3xl (768px)   → xl / 1280px
// wide   → max-w-[1100px]      → 1440px
// wider  → max-w-[1200px]      → 1520px

type ContentWidth = "narrow" | "wide" | "wider";

const CONFIG: Record<ContentWidth, { outerClass: string; sideClass: string }> = {
  narrow: {
    outerClass: "xl:grid xl:grid-cols-[160px_1fr_160px] xl:gap-4",
    sideClass:  "hidden xl:block",
  },
  wide: {
    outerClass: "[@media(min-width:1440px)]:grid [@media(min-width:1440px)]:grid-cols-[155px_1fr_155px] [@media(min-width:1440px)]:gap-4",
    sideClass:  "hidden [@media(min-width:1440px)]:block",
  },
  wider: {
    outerClass: "[@media(min-width:1520px)]:grid [@media(min-width:1520px)]:grid-cols-[150px_1fr_150px] [@media(min-width:1520px)]:gap-3",
    sideClass:  "hidden [@media(min-width:1520px)]:block",
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

  // Reklam yoksa layout'u hiç değiştirme
  if (!ad) return <>{children}</>;

  const cfg = CONFIG[contentWidth];

  return (
    <div className={cfg.outerClass}>
      {/* Sol sidebar */}
      <div className={cfg.sideClass}>
        <div className="sticky top-6">
          <SidebarAd ad={ad} side="left" />
        </div>
      </div>

      {/* İçerik */}
      {children}

      {/* Sağ sidebar */}
      <div className={cfg.sideClass}>
        <div className="sticky top-6">
          <SidebarAd ad={ad} side="right" />
        </div>
      </div>
    </div>
  );
}
