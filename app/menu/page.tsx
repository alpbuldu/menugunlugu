import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTodayMenu } from "@/lib/supabase/queries";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Recipe, Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";

export const metadata: Metadata = {
  title: "Günün Menüsü",
  description: "Bugünün özel menüsünü keşfedin.",
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
  recipe, category, author, initialFollowing, isLoggedIn,
}: {
  recipe: Recipe; category: Category; author: AuthorInfo;
  initialFollowing: boolean; isLoggedIn: boolean;
}) {
  return (
    <div className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
      <Link href={`/recipes/${recipe.slug}`} className="flex flex-col flex-1">
        <div className="relative h-28 sm:h-44 bg-warm-100 shrink-0">
          {recipe.image_url ? (
            <Image src={recipe.image_url} alt={recipe.title} fill
              className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex items-center justify-center h-full text-5xl text-warm-300">🍽️</div>
          )}
        </div>
        <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
          <Badge category={category} className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5" />
          <h2 className="text-sm sm:text-base font-semibold text-warm-800 mt-1.5 sm:mt-2 group-hover:text-brand-700 transition-colors leading-snug">
            {recipe.title}
          </h2>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2.5 sm:pb-3 pt-1.5 sm:pt-2 border-t border-warm-100">
        <Link href={`/uye/${author.username}`} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity group/author">
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {author.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-[10px] font-medium text-warm-500 group-hover/author:text-brand-600 transition-colors truncate">
            {author.name}
          </span>
        </Link>
        {/* Mobil: yuvarlak ikon (+/✓), masaüstü: yazılı buton */}
        <span className="sm:hidden">
          <FollowButton
            targetUserId={author.isAdmin ? undefined : author.userId ?? undefined}
            isAdminProfile={author.isAdmin}
            initialFollowing={initialFollowing}
            isLoggedIn={isLoggedIn}
            size="icon"
          />
        </span>
        <span className="hidden sm:block">
          <FollowButton
            targetUserId={author.isAdmin ? undefined : author.userId ?? undefined}
            isAdminProfile={author.isAdmin}
            initialFollowing={initialFollowing}
            isLoggedIn={isLoggedIn}
            size="sm"
          />
        </span>
      </div>
    </div>
  );
}

export default async function MenuPage() {
  const menu = await getTodayMenu();

  const supabase = createAdminClient();
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentUserId = user?.id ?? null;

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

  // Takip durumları
  let followsAdmin = false;
  const followedMemberIds = new Set<string>();
  if (currentUserId && menu) {
    const memberIds = [...new Set(Object.keys(profileMap))];
    const [adminRes, memberRes] = await Promise.all([
      userSupabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? userSupabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminRes.data;
    (memberRes.data ?? []).forEach((f: any) => followedMemberIds.add(f.following_id));
  }

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Günün Menüsü</h1>
      <p className="text-warm-500 mb-4 sm:mb-10 capitalize">{today}</p>

      {!menu ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-lg font-medium text-warm-700">Bugün için henüz menü yayınlanmamış.</p>
          <p className="text-sm text-warm-400 mt-2">Lütfen daha sonra tekrar kontrol edin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categoryOrder.map(({ field, category }) => {
            const recipe = menu[field];
            const author = recipe.submitted_by
              ? (profileMap[recipe.submitted_by] ?? adminAuthor)
              : adminAuthor;
            const initialFollowing = author.isAdmin
              ? followsAdmin
              : author.userId ? followedMemberIds.has(author.userId) : false;
            return (
              <RecipeCard
                key={field}
                recipe={recipe}
                category={category}
                author={author}
                initialFollowing={initialFollowing}
                isLoggedIn={!!currentUserId}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 sm:mt-12 sm:text-center">
        <Link href="/recipes"
          className="flex sm:inline-flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors border border-warm-200 rounded-xl px-4 py-3 hover:bg-warm-50">
          Tüm tarifleri gör →
        </Link>
      </div>
    </div>
  );
}
