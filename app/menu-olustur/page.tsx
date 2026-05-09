import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import MenuBuilder from "./MenuBuilder";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Menü Oluştur | Menü Günlüğü",
  description: "Tarifler arasından seçim yap, günlük menünü oluştur ve paylaş.",
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

export default async function MenuOlusturPage() {
  redirect("/");
  const supabase = createAdminClient();

  const [recipesResult, memberProfilesResult, apResult] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, slug, category, image_url, ingredients, submitted_by, kcal_per_person")
      .eq("approval_status", "approved")
      .order("title"),
    supabase.from("profiles").select("id, username"),
    supabase.from("admin_profile").select("id, username, avatar_url").eq("id", 1).single(),
  ]);

  const recipes        = recipesResult.data ?? [];
  const memberProfiles = memberProfilesResult.data ?? [];
  const ap             = apResult.data;

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

  return (
    <SidebarLayout placement="sidebar_menu_olustur" adSenseSlot="menu_olustur_dikey">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot placement="menu_olustur_banner_mobile" adSenseSlot="menu_olustur_yatay"
          imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />
        <div className="flex items-center gap-2 mb-4">
          <Link href="/menu-gunlugu" className="text-xs text-warm-400 hover:text-warm-600 transition-colors">
            ← Menü Günlüğü
          </Link>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-warm-900">Menü Oluştur ✨</h1>
        </div>
        <MenuBuilder grouped={grouped} />
      </div>
      <PagePopup page="menu_olustur" />
    </SidebarLayout>
  );
}
