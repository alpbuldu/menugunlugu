import type { Metadata } from "next";
import Link from "next/link";
import RecipeForm from "@/components/admin/RecipeForm";

export const metadata: Metadata = { title: "Yeni Tarif" };

export default function NewRecipePage() {
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
        <h1 className="text-2xl font-bold text-warm-900">Yeni Tarif Ekle</h1>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
        <RecipeForm />
      </div>
    </div>
  );
}
