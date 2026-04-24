import { createAdminClient } from "@/lib/supabase/server";
import SitePopup from "./SitePopup";

interface Props {
  page: string;
}

export default async function PagePopup({ page }: Props) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("page_popups")
    .select("image_url, link_url, is_active")
    .eq("page", page)
    .single();

  if (!data || !data.is_active || !data.image_url) return null;

  return (
    <SitePopup
      imageUrl={data.image_url}
      linkUrl={data.link_url}
      placement={page}
    />
  );
}
