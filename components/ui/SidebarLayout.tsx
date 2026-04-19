import { createAdminClient } from "@/lib/supabase/server";

interface Ad {
  image_url: string;
  link_url: string;
  title: string | null;
}

function SidebarAd({ ad, side }: { ad: Ad; side: "left" | "right" }) {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
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

const OUTER = "[@media(min-width:1440px)]:grid [@media(min-width:1440px)]:grid-cols-[155px_1fr_155px] [@media(min-width:1440px)]:gap-4";
const SIDE  = "hidden [@media(min-width:1440px)]:block pt-10 pb-16";

export default async function SidebarLayout({
  children,
  placement,
}: {
  children: React.ReactNode;
  placement: string;
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

  if (!ad) return <>{children}</>;

  return (
    <div className={OUTER}>
      {/* Sol sidebar */}
      <div className={SIDE}>
        <div className="sticky top-20">
          <SidebarAd ad={ad} side="left" />
        </div>
      </div>

      {/* İçerik */}
      {children}

      {/* Sağ sidebar */}
      <div className={SIDE}>
        <div className="sticky top-20">
          <SidebarAd ad={ad} side="right" />
        </div>
      </div>
    </div>
  );
}
