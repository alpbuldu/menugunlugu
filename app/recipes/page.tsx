import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdBanner from "@/components/ui/AdBanner";

export const metadata: Metadata = {
  title: "Tarifler",
  description: "Tüm tarifleri kategorilere göre keşfedin.",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 16;

type CategoryFilter = Category | "all";

const categories: { key: CategoryFilter; label: string; short: string }[] = [
  { key: "all",     label: "Tümü",              short: "Tümü"      },
  { key: "soup",    label: "Çorbalar",           short: "Çorba"     },
  { key: "main",    label: "Ana Yemekler",       short: "Ana"       },
  { key: "side",    label: "Yardımcı Lezzetler", short: "Yardımcı"  },
  { key: "dessert", label: "Tatlılar",           short: "Tatlı"     },
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

  // Takip durumu
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  let followsAdmin = false;
  const followedMemberIds = new Set<string>();
  if (currentUserId) {
    const [adminFollowRes, memberFollowRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminFollowRes.data;
    (memberFollowRes.data ?? []).forEach((f: any) => followedMemberIds.add(f.following_id));
  }

  /** Her zaman ilk 2 + son 2 + mevcut±1 göster; araya … ekle */
  function buildPages(current: number, total: number): (number | "…")[] {
    const pagesSet = new Set<number>();
    pagesSet.add(1); pagesSet.add(2);
    pagesSet.add(total - 1); pagesSet.add(total);
    for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) pagesSet.add(p);
    const sorted = Array.from(pagesSet).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) result.push("…");
    }
    return result;
  }

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
    <SidebarLayout placement="sidebar_recipes">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Tarifler</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4">Kategorilere göre tarifleri keşfedin.</p>

      {/* Category Filter */}
      <div className="flex gap-1 sm:flex-wrap sm:gap-2 mb-4 sm:mb-8">
        {categories.map((cat) => {
          const isActive =
            cat.key === "all" ? !activeCategory : activeCategory === cat.key;
          return (
            <Link
              key={cat.key}
              href={href({ category: cat.key === "all" ? undefined : cat.key, page: 1 })}
              className={`flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
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

      {/* Yatay reklam banneri — masaüstü */}
      <AdBanner placement="recipes_banner" imageHeight="h-[100px]" className="hidden sm:block mb-8" />
      {/* Yatay reklam banneri — mobil */}
      <AdBanner placement="recipes_banner_mobile" imageHeight="h-[70px]" className="sm:hidden mb-4" />

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Bu kategoride henüz tarif yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {recipes.map((recipe) => {
            const a = getAuthor(recipe.submitted_by ?? null);
            const isAdmin = !recipe.submitted_by;
            const initialFollowing = isAdmin ? followsAdmin : followedMemberIds.has(recipe.submitted_by!);
            return (
              <div
                key={recipe.id}
                className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <Link href={`/recipes/${recipe.slug}`} className="flex flex-col flex-1">
                  <div className="relative h-28 sm:h-40 bg-warm-100 shrink-0">
                    {recipe.image_url ? (
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl text-warm-300">
                        🍳
                      </div>
                    )}
                  </div>
                  <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
                    <Badge category={recipe.category as Category} className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5" />
                    <h2 className="text-sm sm:text-base font-semibold text-warm-800 mt-1.5 sm:mt-2 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                      {recipe.title}
                    </h2>
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2.5 sm:pb-3 pt-1.5 sm:pt-2 border-t border-warm-100">
                  <Link href={`/uye/${a.username}`} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity group/author">
                    {a.avatar ? (
                      <img src={a.avatar} alt={a.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] sm:text-[10px] text-warm-300 leading-none sm:mb-0.5">Yazar</span>
                      <span className="text-[10px] sm:text-xs font-medium text-warm-500 group-hover/author:text-brand-600 transition-colors truncate">{a.name}</span>
                    </div>
                  </Link>
                  <span className="sm:hidden">
                    <FollowButton
                      targetUserId={isAdmin ? undefined : recipe.submitted_by ?? undefined}
                      isAdminProfile={isAdmin}
                      initialFollowing={initialFollowing}
                      isLoggedIn={!!currentUserId}
                      size="icon"
                    />
                  </span>
                  <span className="hidden sm:block">
                    <FollowButton
                      targetUserId={isAdmin ? undefined : recipe.submitted_by ?? undefined}
                      isAdminProfile={isAdmin}
                      initialFollowing={initialFollowing}
                      isLoggedIn={!!currentUserId}
                      size="xs"
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
          {currentPage > 1 ? (
            <Link href={href({ page: currentPage - 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Önceki sayfa">‹</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">‹</span>
          )}

          {buildPages(currentPage, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="text-warm-400 text-sm px-1">…</span>
            ) : (
              <Link key={p} href={href({ page: p })}
                aria-current={p === currentPage ? "page" : undefined}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                  p === currentPage
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"
                }`}>
                {p}
              </Link>
            )
          )}

          {currentPage < totalPages ? (
            <Link href={href({ page: currentPage + 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Sonraki sayfa">›</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">›</span>
          )}
        </div>
      )}
    </div>
    </SidebarLayout>
  );
}
