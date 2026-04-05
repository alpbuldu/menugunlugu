// @ts-nocheck
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTodayMenu } from "@/lib/supabase/queries";
import type { Recipe, Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Günün Menüsü",
  description: "Bugünün özel menüsünü keşfedin.",
};

// Always fetch fresh — the menu changes daily
export const dynamic = "force-dynamic";

const categoryOrder: { key: keyof Pick<typeof import("@/lib/types"), never>; label: string; field: "soup" | "main" | "side" | "dessert"; category: Category }[] = [
  { key: "soup",    label: "Çorba",      field: "soup",    category: "soup" },
  { key: "main",    label: "Ana Yemek",  field: "main",    category: "main" },
  { key: "side",    label: "Eşlikçi",  field: "side",    category: "side" },
  { key: "dessert", label: "Tatlı",      field: "dessert", category: "dessert" },
];

function RecipeCard({ recipe, category }: { recipe: Recipe; category: Category }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
    >
      <div className="relative h-52 bg-warm-100">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl text-warm-300">
            🍽️
          </div>
        )}
      </div>
      <div className="p-5">
        <Badge category={category} />
        <h2 className="text-lg font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors">
          {recipe.title}
        </h2>
        <p className="text-sm text-brand-500 mt-1">Tarifi gör →</p>
      </div>
    </Link>
  );
}

export default async function MenuPage() {
  const menu = await getTodayMenu();

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Günün Menüsü</h1>
      <p className="text-warm-500 mb-10 capitalize">{today}</p>

      {!menu ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-lg font-medium text-warm-700">
            Bugün için henüz menü yayınlanmamış.
          </p>
          <p className="text-sm text-warm-400 mt-2">
            Lütfen daha sonra tekrar kontrol edin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categoryOrder.map(({ field, category }) => {
            const recipe = menu[field];
            return <RecipeCard key={field} recipe={recipe} category={category} />;
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors"
        >
          Tüm tarifleri gör →
        </Link>
      </div>
    </div>
  );
}
