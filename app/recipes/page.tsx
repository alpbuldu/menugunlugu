import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRecipes } from "@/lib/supabase/queries";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Tarifler",
  description: "Tüm tarifleri kategorilere göre keşfedin.",
};

export const revalidate = 3600;

const PER_PAGE = 12;

type CategoryFilter = Category | "all";

const categories: { key: CategoryFilter; label: string }[] = [
  { key: "all",     label: "Tümü" },
  { key: "soup",    label: "Çorbalar" },
  { key: "main",    label: "Ana Yemekler" },
  { key: "side",    label: "Eşlikçi Lezzetler" },
  { key: "dessert", label: "Tatlılar" },
];

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function RecipesPage({ searchParams }: Props) {
  const { category: categoryParam, page: pageParam } = await searchParams;

  const validCategories: Category[] = ["soup", "main", "side", "dessert"];
  const activeCategory =
    categoryParam && validCategories.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : undefined;

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const allRecipes = await getRecipes(activeCategory);
  const totalPages = Math.ceil(allRecipes.length / PER_PAGE);
  const recipes = allRecipes.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  /** Build ?category=X&page=Y preserving current filters */
  function href(overrides: { category?: string; page?: number }) {
    const p = new URLSearchParams();
    const cat = "category" in overrides ? overrides.category : activeCategory;
    if (cat) p.set("category", cat);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/recipes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-8">Tarifler</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => {
          const isActive =
            cat.key === "all" ? !activeCategory : activeCategory === cat.key;
          return (
            <Link
              key={cat.key}
              href={href({ category: cat.key === "all" ? undefined : cat.key, page: 1 })}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Bu kategoride henüz tarif yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
              className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
            >
              <div className="relative h-48 bg-warm-100 shrink-0">
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl text-warm-300">
                    🍳
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <Badge category={recipe.category as Category} />
                <h2 className="text-base font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {recipe.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
          {/* Prev */}
          {currentPage > 1 ? (
            <Link
              href={href({ page: currentPage - 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Önceki sayfa"
            >
              ‹
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">
              ‹
            </span>
          )}

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = p === currentPage;
            // Show first, last, current ±1, and ellipsis in between
            const show =
              p === 1 ||
              p === totalPages ||
              Math.abs(p - currentPage) <= 1;
            const showEllipsisBefore =
              p === currentPage - 2 && currentPage - 2 > 1;
            const showEllipsisAfter =
              p === currentPage + 2 && currentPage + 2 < totalPages;

            if (!show) return null;

            return (
              <span key={p} className="flex items-center gap-1.5">
                {showEllipsisBefore && (
                  <span className="text-warm-400 text-sm px-1">…</span>
                )}
                <Link
                  href={href({ page: p })}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                    isCurrent
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {p}
                </Link>
                {showEllipsisAfter && (
                  <span className="text-warm-400 text-sm px-1">…</span>
                )}
              </span>
            );
          })}

          {/* Next */}
          {currentPage < totalPages ? (
            <Link
              href={href({ page: currentPage + 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Sonraki sayfa"
            >
              ›
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">
              ›
            </span>
          )}
        </div>
      )}
    </div>
  );
}
