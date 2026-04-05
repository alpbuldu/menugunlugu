import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { adminGetRecipeById } from "@/lib/supabase/admin-queries";
import RecipeForm from "@/components/admin/RecipeForm";

export const metadata: Metadata = { title: "Tarifi Düzenle" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const recipe = await adminGetRecipeById(id);

  if (!recipe) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/recipes"
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
        >
          ← Tarifler
        </Link>
        <span className="text-warm-200">/</span>
        <h1 className="text-2xl font-bold text-warm-900">Tarifi Düzenle</h1>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
        <RecipeForm recipe={recipe} />
      </div>
    </div>
  );
}
