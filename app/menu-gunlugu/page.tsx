import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import MenuGunluguClient from "./MenuGunluguClient";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";

export const metadata: Metadata = {
  title: "Menü Günlüğü",
  description: "Kendi menünü oluştur, paylaş ve geçmiş menülerini kaydet.",
};

export const dynamic = "force-dynamic";

export interface MenuRecipe {
  id: string;
  title: string;
  slug: string;
  category: Category;
  image_url: string | null;
  ingredients: string;
  author: string;
  kcal_per_person: number | null;
}

export default async function MenuGunluguPage() {
  const supabase = createAdminClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

  const [
    recipesResult,
    memberProfilesResult,
    apResult,
    todayMenuResult,
    feedPostsResult,
  ] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, slug, category, image_url, ingredients, submitted_by, kcal_per_person")
      .eq("approval_status", "approved")
      .order("title"),
    supabase.from("profiles").select("id, username"),
    supabase.from("admin_profile").select("id, username, avatar_url").eq("id", 1).single(),
    supabase
      .from("menus")
      .select("id, date, soup:soup_id(id,title,slug,image_url,kcal_per_person), main:main_id(id,title,slug,image_url,kcal_per_person), side:side_id(id,title,slug,image_url,kcal_per_person), dessert:dessert_id(id,title,slug,image_url,kcal_per_person)")
      .eq("status", "published")
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("menu_feed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const recipes       = recipesResult.data ?? [];
  const memberProfiles = memberProfilesResult.data ?? [];
  const ap            = apResult.data;
  const todayMenu     = todayMenuResult.data;
  const feedPosts     = feedPostsResult.data ?? [];

  const profileMap: Record<string, string> = {};
  for (const p of memberProfiles as any[]) profileMap[p.id] = p.username;
  const adminName = ap?.username ?? "Menü Günlüğü";

  const allRecipes: MenuRecipe[] = (recipes as any[]).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category as Category,
    image_url: r.image_url,
    ingredients: r.ingredients ?? "",
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? adminName) : adminName,
    kcal_per_person: r.kcal_per_person ?? null,
  }));

  const grouped: Record<Category, MenuRecipe[]> = {
    soup:    allRecipes.filter((r) => r.category === "soup"),
    main:    allRecipes.filter((r) => r.category === "main"),
    side:    allRecipes.filter((r) => r.category === "side"),
    dessert: allRecipes.filter((r) => r.category === "dessert"),
  };

  // Feed — yazar bilgisi ekle
  const feedUserIds = [...new Set((feedPosts as any[]).map((p: any) => p.user_id).filter(Boolean))];
  const feedProfilesResult = feedUserIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", feedUserIds)
    : { data: [] };
  const feedProfileMap: Record<string, { username: string; avatar_url: string | null }> = {};
  (feedProfilesResult.data ?? []).forEach((p: any) => { feedProfileMap[p.id] = p; });

  const enrichedFeed = (feedPosts as any[]).map((p: any) => ({
    ...p,
    author: feedProfileMap[p.user_id] ?? { username: ap?.username ?? "Menü Günlüğü", avatar_url: ap?.avatar_url ?? null },
  }));

  return (
    <SidebarLayout placement="sidebar_menu_olustur" adSenseSlot="menu_olustur_dikey">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot placement="menu_olustur_banner_mobile" adSenseSlot="menu_olustur_yatay"
          imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />
        <MenuGunluguClient
          grouped={grouped}
          todayMenu={todayMenu as any}
          initialFeed={enrichedFeed}
          adminProfile={ap ? { username: ap.username, avatar_url: ap.avatar_url } : null}
        />
      </div>
      <PagePopup page="menu_olustur" />
    </SidebarLayout>
  );
}
