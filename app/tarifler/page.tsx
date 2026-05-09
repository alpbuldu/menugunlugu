import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import SidebarLayout from "@/components/ui/SidebarLayout";
import PagePopup from "@/components/ui/PagePopup";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Tarifler",
  description: "Tüm tarifleri kategorilere göre keşfedin.",
  alternates: { canonical: "/tarifler" },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

type CategoryFilter = Category | "all";

const categories: { key: CategoryFilter; label: string; slug: string }[] = [
  { key: "all",     label: "Tümü",              slug: ""                   },
  { key: "soup",    label: "Çorbalar",           slug: "corbalar"           },
  { key: "main",    label: "Ana Yemekler",       slug: "ana-yemekler"       },
  { key: "side",    label: "Yardımcı Lezzetler", slug: "yardimci-lezzetler" },
  { key: "dessert", label: "Tatlılar",           slug: "tatlilar"           },
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

  const supabase = await createClient();
  const allRecipes = await getRecipes(activeCategory);
  const totalPages = Math.ceil(allRecipes.length / PER_PAGE);
  const recipes = allRecipes.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  // Yazar verileri
  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: ap?.username ?? "__admin__" };
  const memberIds = [...new Set(recipes.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const profileMap: Record<string, { name: string; avatar: string; username: string }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach((p) => { profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username }; });
  }
  function getAuthor(submittedBy: string | null) {
    return submittedBy ? (profileMap[submittedBy] ?? adminAuthor) : adminAuthor;
  }


  function buildPages(current: number, total: number): number[] {
    const WINDOW = 3;
    let start = Math.max(1, current - Math.floor(WINDOW / 2));
    let end   = Math.min(total, start + WINDOW - 1);
    if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /** Build ?category=X&page=Y preserving current filters */
  function href(overrides: { category?: string; page?: number }) {
    const p = new URLSearchParams();
    const cat = "category" in overrides ? overrides.category : activeCategory;
    if (cat) p.set("category", cat);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/tarifler${qs ? `?${qs}` : ""}`;
  }

  return (
    <SidebarLayout placement="sidebar_recipes" adSenseSlot="tarifler_dikey_masaustu">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <PageHeader
        title="Tarifler"
        description="Çorba, ana yemek, yardımcı lezzet ve tatlı kategorilerinde yüzlerce tarif."
        emoji="📖"
      />
      {/* Category Filter */}
      <div className="mb-4 sm:mb-8">
        <p className="text-sm font-bold text-warm-800 mb-2 sm:hidden">Kategoriler:</p>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <span className="text-sm font-bold text-warm-800 flex-shrink-0 hidden sm:block">Kategoriler:</span>
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.key === "all" ? "/tarifler" : `/tarifler/kategori/${cat.slug}`}
              className="flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>


      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Bu kategoride henüz tarif yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recipes.map((recipe, index) => {
            const a = getAuthor(recipe.submitted_by ?? null);
            return (
              <Link
                key={recipe.id}
                href={`/tarifler/${recipe.slug}`}
                className="relative block rounded-xl sm:rounded-2xl overflow-hidden h-44 sm:h-64 group hover:shadow-lg transition-all"
              >
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className={`object-cover object-${(recipe as any).image_position ?? "center"} group-hover:scale-105 transition-transform duration-300`}
                    priority={index < 4}
                  />
                ) : (
                  <div className="absolute inset-0 bg-warm-100 flex items-center justify-center text-4xl text-warm-300">🍳</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-2.5 left-2.5 hidden sm:block">
                  <Badge category={recipe.category as Category} compact className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h2 className="text-sm sm:text-base font-bold text-white leading-snug mb-2 line-clamp-2">{recipe.title}</h2>
                  <div className="flex items-center gap-1.5">
                    {a.avatar ? (
                      <img src={a.avatar} alt={a.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/25 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="text-[11px] sm:text-xs text-white/80 truncate">{a.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const btn      = "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium border transition-colors";
        const inactive = `${btn} bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600`;
        const active   = `${btn} bg-brand-600 border-brand-600 text-white`;
        const dis      = `${btn} border-warm-100 text-warm-300 cursor-default`;
        const pages    = buildPages(currentPage, totalPages);
        return (
          <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
            {currentPage > 1 ? <Link href={href({ page: 1 })}                  className={inactive}>«</Link> : <span className={dis}>«</span>}
            {currentPage > 1 ? <Link href={href({ page: currentPage - 1 })}    className={inactive}>‹</Link> : <span className={dis}>‹</span>}
            {pages.map((p) => (
              <Link key={p} href={href({ page: p })} aria-current={p === currentPage ? "page" : undefined}
                className={p === currentPage ? active : inactive}>{p}</Link>
            ))}
            {currentPage < totalPages ? <Link href={href({ page: currentPage + 1 })} className={inactive}>›</Link> : <span className={dis}>›</span>}
            {currentPage < totalPages ? <Link href={href({ page: totalPages })}       className={inactive}>»</Link> : <span className={dis}>»</span>}
          </div>
        );
      })()}
    </div>
      <PagePopup page="tarifler" />
    </SidebarLayout>
  );
}
