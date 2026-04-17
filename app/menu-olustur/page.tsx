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
}

export default async function MenuOlusturPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, ingredients")
    .eq("approval_status", "approved")
    .order("title");

  const allRecipes = (recipes ?? []) as MenuRecipe[];

  const grouped: Record<Category, MenuRecipe[]> = {
    soup:    allRecipes.filter((r) => r.category === "soup"),
    main:    allRecipes.filter((r) => r.category === "main"),
    side:    allRecipes.filter((r) => r.category === "side"),
    dessert: allRecipes.filter((r) => r.category === "dessert"),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-warm-900 mb-2">Menü Oluştur</h1>
        <p className="text-warm-500 text-sm">
          Her kategoriden bir yemek seç ve günün menüsünü oluştur. PDF tarif kartı olarak ya da sosyal medyada paylaşmak için post veya story formatında indir.
        </p>
      </div>
      <MenuBuilder grouped={grouped} />
    </div>
  );
}
