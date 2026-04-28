import type { Metadata } from "next";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import PostOlusturClient from "./PostOlusturClient";

export const metadata: Metadata = { title: "Post Oluştur" };

export default async function PostOlusturPage() {
  const recipes = await adminGetAllRecipes();

  const simpleRecipes = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-warm-900 mb-2">Post Oluştur</h1>
      <p className="text-sm text-warm-400 mb-8">
        Tarif görselleri, kapak ve story oluştur
      </p>
      <PostOlusturClient recipes={simpleRecipes} />
    </div>
  );
}
