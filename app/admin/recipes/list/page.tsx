import type { Metadata } from "next";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import RecipeListClient from "./RecipeListClient";

export const metadata: Metadata = { title: "Tarif Listesi" };
export const dynamic = "force-dynamic";

export default async function RecipeListPage() {
  const recipes = await adminGetAllRecipes();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Tarif Listesi</h1>
        <p className="text-sm text-warm-500 mt-1">
          Kategoriye göre gruplandırılmış tüm tarifler. İsme tıklayarak kopyalayabilirsin.
        </p>
      </div>

      <RecipeListClient recipes={recipes} />
    </div>
  );
}
