import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import DeleteButton from "@/components/admin/DeleteButton";
import Badge from "@/components/ui/Badge";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Tarifler" };
export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  const recipes = await adminGetAllRecipes();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Tarifler</h1>
          <p className="text-sm text-warm-400 mt-0.5">{recipes.length} tarif</p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Yeni Tarif
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-warm-600 font-medium mb-1">Henüz tarif eklenmemiş</p>
          <p className="text-sm text-warm-400 mb-6">İlk tarifinizi ekleyin</p>
          <Link
            href="/admin/recipes/new"
            className="inline-flex px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Tarif Ekle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  Tarif
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">
                  Kategori
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {recipes.map((recipe) => {
                const hasImage = recipe.image_url && recipe.image_url.trim();
                return (
                  <tr key={recipe.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-warm-100 shrink-0">
                          {hasImage ? (
                            <Image
                              src={recipe.image_url!}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-lg text-warm-300">
                              🍽️
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-warm-800">{recipe.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge category={recipe.category as Category} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/admin/recipes/${recipe.id}/edit`}
                          className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors"
                        >
                          Düzenle
                        </Link>
                        <DeleteButton
                          endpoint={`/api/recipes/${recipe.id}`}
                          label={`"${recipe.title}" tarifini silmek istediğinizden emin misiniz?`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
