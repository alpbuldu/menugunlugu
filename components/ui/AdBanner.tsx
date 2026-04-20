import { createAdminClient } from "@/lib/supabase/server";

export type AdPlacement =
  | "home"
  | "sidebar_recipes"
  | "sidebar_recipe_detail"
  | "sidebar_blog"
  | "sidebar_blog_post";

interface Props {
  placement: AdPlacement;
  className?: string;
}

export default async function AdBanner({ placement, className = "" }: Props) {
  const supabase = createAdminClient();
  const { data: ad } = await supabase
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ad) return null;

  return (
    <div className={`${className}`}>
      <p className="text-[10px] text-warm-300 mb-1 text-right tracking-wide">
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
