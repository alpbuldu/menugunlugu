import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTodayMenu } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/server";
import type { Recipe, Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";

export const metadata: Metadata = {
  title: "Günün Menüsü",
  description: "Bugünün özel menüsünü keşfedin.",
  alternates: { canonical: "/gunun-menusu" },
};

export const dynamic = "force-dynamic";

interface AuthorInfo { name: string; avatar: string; username: string; userId: string | null; isAdmin: boolean; }

const categoryOrder = [
  { field: "soup"    as const, category: "soup"    as Category },
  { field: "main"    as const, category: "main"    as Category },
  { field: "side"    as const, category: "side"    as Category },
  { field: "dessert" as const, category: "dessert" as Category },
];

function RecipeCard({
  recipe, category, author,
}: {
  recipe: Recipe; category: Category; author: AuthorInfo;
}) {
  return (
    <Link href={`/recipes/${recipe.slug}`} className="relative block rounded-xl sm:rounded-2xl overflow-hidden h-36 sm:h-48 group hover:shadow-lg transition-all">
      {recipe.image_url ? (
        <Image src={recipe.image_url} alt={recipe.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="absolute inset-0 bg-warm-100 flex items-center justify-center text-5xl text-warm-300">🍽️</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {/* top-left: category */}
      <div className="absolute top-2 left-2">
        <Badge category={category} compact className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5" />
      </div>
      {/* top-right: kcal */}
      {(recipe as any).kcal_per_person && (
        <span className="absolute top-2 right-2 text-[9px] sm:text-[10px] font-bold text-white drop-shadow">
          {(recipe as any).kcal_per_person} kcal
        </span>
      )}
      {/* bottom: title + author */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
        <h2 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1.5 line-clamp-2">{recipe.title}</h2>
        <div className="flex items-center gap-1.5">
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/25 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
              {author.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-[9px] sm:text-[10px] text-white/80 truncate">{author.name}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function MenuPage() {
  const menu = await getTodayMenu();

  const supabase = createAdminClient();

  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor: AuthorInfo = {
    name: ap?.username ?? "Menü Günlüğü",
    avatar: ap?.avatar_url ?? "",
    username: "__admin__",
    userId: null,
    isAdmin: true,
  };

  const profileMap: Record<string, AuthorInfo> = {};
  if (menu) {
    const memberIds = [menu.soup, menu.main, menu.side, menu.dessert]
      .map((r) => r?.submitted_by).filter(Boolean) as string[];
    const uniqueIds = [...new Set(memberIds)];
    if (uniqueIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", uniqueIds);
      profiles?.forEach((p) => {
        profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username, userId: p.id, isAdmin: false };
      });
    }
  }

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Europe/Istanbul",
  });

  const totalKcal = menu
    ? [menu.soup, menu.main, menu.side, menu.dessert]
        .reduce((sum, r) => sum + ((r as any)?.kcal_per_person ?? 0), 0)
    : 0;

  return (
    <SidebarLayout placement="sidebar_menu" adSenseSlot="gunun_menusu_dikey">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <p className="text-sm sm:text-base text-warm-700 font-semibold capitalize mb-4">{today} Günün Menüsü</p>

      {/* Banner — açıklama altında, kartlar üstünde */}
      <AdSlot placement="menu_banner" adSenseSlot="gunun_menusu_yatay"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="block sm:hidden mb-6" />
      <AdSlot placement="menu_banner" adSenseSlot="gunun_menusu_yatay"
        imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="hidden sm:block mb-8" />

      {!menu ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-lg font-medium text-warm-700">Bugün için henüz menü yayınlanmamış.</p>
          <p className="text-sm text-warm-400 mt-2">Lütfen daha sonra tekrar kontrol edin.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categoryOrder.map(({ field, category }) => {
            const recipe = menu[field];
            const author = recipe.submitted_by
              ? (profileMap[recipe.submitted_by] ?? adminAuthor)
              : adminAuthor;
            return (
              <RecipeCard
                key={field}
                recipe={recipe}
                category={category}
                author={author}
              />
            );
          })}
        </div>
        {totalKcal > 0 && (
          <p className="mt-3 text-xs text-warm-500 font-semibold text-right">
            Toplam: {totalKcal} kcal
          </p>
        )}
        </>
      )}

      <div className="mt-6 sm:mt-8 sm:text-center">
        <Link href="/recipes"
          className="flex sm:inline-flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors border border-warm-200 rounded-xl px-4 py-3 hover:bg-warm-50">
          Tüm tarifleri gör →
        </Link>
      </div>
    </div>
      <PagePopup page="gunun_menusu" />
    </SidebarLayout>
  );
}
