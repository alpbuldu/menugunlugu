import { createAdminClient } from "@/lib/supabase/server";

interface Ad {
  image_url: string;
  link_url: string;
  title: string | null;
}

function SidebarAd({ ad }: { ad: Ad }) {
  return (
    <div>
      <p className="text-[10px] text-warm-300 mb-1 text-right tracking-wide">Reklam</p>
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

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createAdminClient();
  const { data: ad } = await supabase
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", "sidebar")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="relative">
      {ad && (
        <>
          {/* Sol sidebar — sadece 2xl+ ekranlarda */}
          <div className="hidden 2xl:block absolute left-4 top-10 w-[160px]">
            <SidebarAd ad={ad} />
          </div>
          {/* Sağ sidebar — sadece 2xl+ ekranlarda */}
          <div className="hidden 2xl:block absolute right-4 top-10 w-[160px]">
            <SidebarAd ad={ad} />
          </div>
        </>
      )}
      {children}
    </div>
  );
}
