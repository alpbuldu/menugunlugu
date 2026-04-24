import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";

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
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Tarifler</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4">Kategorilere göre tarifleri keşfedin.</p>

      {/* Category Filter */}
      <div className="flex gap-1 sm:flex-wrap sm:gap-2 mb-4 sm:mb-8">
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

      {/* Yatay reklam banneri */}
      <AdSlot placement="recipes_banner" adSenseSlot="tarifler_yatay_masaustu"
        imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="hidden sm:block mb-8" />
      <AdSlot placement="recipes_banner_mobile" adSenseSlot="tarifler_yatay_mobil"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Bu kategoride henüz tarif yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recipes.map((recipe) => {
            const a = getAuthor(recipe.submitted_by ?? null);
            const isAdmin = !recipe.submitted_by;
            const initialFollowing = isAdmin ? followsAdmin : followedMemberIds.has(recipe.submitted_by!);
            return (
              <div
                key={recipe.id}
                className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <Link href={`/tarifler/${recipe.slug}`} className="flex flex-col flex-1">
                  <div className="relative h-28 sm:h-40 bg-warm-100 shrink-0">
                    {recipe.image_url ? (
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
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
    </SidebarLayout>
  );
}
