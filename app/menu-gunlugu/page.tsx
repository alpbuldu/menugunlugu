import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import MenuGunluguClient from "./MenuGunluguClient";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";

export const metadata: Metadata = {
  title: "Menü Önerileri",
  description: "Editörün menü önerileri ve topluluk akışı.",
};

export const dynamic = "force-dynamic";

export default async function MenuGunluguPage() {
  const supabase = createAdminClient();

  const [
    apResult,
    feedPostsResult,
    adminMenusResult,
  ] = await Promise.all([
    supabase.from("admin_profile").select("id, username, avatar_url").eq("id", 1).single(),
    supabase
      .from("menu_feed_posts")
      .select("id, user_id, created_at, title, soup_title, main_title, side_title, dessert_title, soup_slug, main_slug, side_slug, dessert_slug, soup_image_url, main_image_url, side_image_url, dessert_image_url, soup_id, main_id, side_id, dessert_id, likes_count, saves_count, comments_count, category")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("menus")
      .select("id, menu_category, date, soup:soup_id(id,title,slug,image_url,kcal_per_person), main:main_id(id,title,slug,image_url,kcal_per_person), side:side_id(id,title,slug,image_url,kcal_per_person), dessert:dessert_id(id,title,slug,image_url,kcal_per_person)")
      .eq("status", "published")
      .not("menu_category", "is", null)
      .order("date", { ascending: false })
      .limit(20),
  ]);

  const ap         = apResult.data;
  const feedPosts  = feedPostsResult.data ?? [];
  const adminMenus = adminMenusResult.data ?? [];

  // Feed — yazar bilgisi + kcal hesapla
  const feedUserIds = [...new Set((feedPosts as any[]).map((p: any) => p.user_id).filter(Boolean))];
  const feedProfilesResult = feedUserIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", feedUserIds)
    : { data: [] };
  const feedProfileMap: Record<string, { username: string; avatar_url: string | null }> = {};
  (feedProfilesResult.data ?? []).forEach((p: any) => { feedProfileMap[p.id] = p; });

  const feedRecipeIds = [...new Set((feedPosts as any[]).flatMap((p: any) =>
    [p.soup_id, p.main_id, p.side_id, p.dessert_id].filter(Boolean)
  ))];
  const feedKcalMap: Record<string, number> = {};
  if (feedRecipeIds.length > 0) {
    const { data: kcalRows } = await supabase.from("recipes").select("id, kcal_per_person").in("id", feedRecipeIds);
    (kcalRows ?? []).forEach((r: any) => { if (r.kcal_per_person) feedKcalMap[r.id] = r.kcal_per_person; });
  }

  const enrichedFeed = (feedPosts as any[]).map((p: any) => ({
    ...p,
    author: feedProfileMap[p.user_id] ?? { username: ap?.username ?? "Menü Günlüğü", avatar_url: ap?.avatar_url ?? null },
    kcal_total: [p.soup_id, p.main_id, p.side_id, p.dessert_id].reduce((sum: number, id: string | null) => sum + (id ? (feedKcalMap[id] ?? 0) : 0), 0),
  }));

  return (
    <SidebarLayout placement="sidebar_menu_olustur" adSenseSlot="menu_olustur_dikey">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot placement="menu_olustur_banner_mobile" adSenseSlot="menu_olustur_yatay"
          imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />
        <MenuGunluguClient
          initialFeed={enrichedFeed}
          adminMenus={adminMenus as any}
        />
      </div>
      <PagePopup page="menu_olustur" />
    </SidebarLayout>
  );
}
