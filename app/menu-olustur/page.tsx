import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import MenuBuilder from "./MenuBuilder";

export const metadata: Metadata = {
  title: "Menü Oluştur",
  description: "Kendi günün menüsünü oluştur, alışveriş listeni hazırla ve menü kartını indir.",
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
}

export default async function MenuOlusturPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, ingredients, submitted_by")
    .eq("approval_status", "approved")
    .order("title");

  // Yazar adlarını çek
  const memberIds = [...new Set(
    (recipes ?? []).filter((r) => r.submitted_by).map((r) => r.submitted_by as string)
  )];
  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles").select("id, username").in("id", memberIds);
    for (const p of profiles ?? []) profileMap[p.id] = p.username;
  }
  const { data: ap } = await supabase.from("admin_profile").select("username").single();
  const adminName = ap?.username ?? "Menü Günlüğü";

  const allRecipes: MenuRecipe[] = (recipes ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category as Category,
    image_url: r.image_url,
    ingredients: r.ingredients,
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName,
  }));

  const grouped: Record<Category, MenuRecipe[]> = {
    soup:    allRecipes.filter((r) => r.category === "soup"),
    main:    allRecipes.filter((r) => r.category === "main"),
    side:    allRecipes.filter((r) => r.category === "side"),
    dessert: allRecipes.filter((r) => r.category === "dessert"),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-10">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-3xl font-bold text-warm-900 mb-1 sm:mb-2">Menü Oluştur</h1>
        <p className="text-warm-500 text-sm">
          Her kategoriden bir yemek seç ve günün menüsünü oluştur. PDF tarif kartı olarak ya da sosyal medyada paylaşmak için post veya story formatında indir.
        </p>
      </div>
      <MenuBuilder grouped={grouped} />
    </div>
  );
}
