// @ts-nocheck
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTodayMenu } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/server";
import type { Recipe, Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Günün Menüsü",
  description: "Bugünün özel menüsünü keşfedin.",
};

// Always fetch fresh — the menu changes daily
export const dynamic = "force-dynamic";

interface AuthorInfo { name: string; avatar: string; username: string; }

const categoryOrder = [
  { field: "soup"    as const, category: "soup"    as Category },
  { field: "main"    as const, category: "main"    as Category },
  { field: "side"    as const, category: "side"    as Category },
  { field: "dessert" as const, category: "dessert" as Category },
];

function RecipeCard({ recipe, category, author }: { recipe: Recipe; category: Category; author: AuthorInfo }) {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
      <Link href={`/recipes/${recipe.slug}`} className="flex flex-col flex-1">
        <div className="relative h-52 bg-warm-100 shrink-0">
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
        <div className="px-5 pt-5 pb-3">
          <Badge category={category} />
          <h2 className="text-lg font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors">
            {recipe.title}
          </h2>
        </div>
      </Link>

      {/* Author */}
      <Link
        href={`/uye/${author.username}`}
        className="flex items-center gap-2 px-5 pb-4 pt-2 border-t border-warm-100 hover:bg-warm-50 transition-colors group/author"
      >
        {author.avatar ? (
          <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {author.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-warm-300 leading-none mb-0.5">Yazar</span>
          <span className="text-xs font-medium text-warm-500 group-hover/author:text-brand-600 transition-colors truncate">
            {author.name}
          </span>
        </div>
      </Link>
    </div>
  );
}

export default async function MenuPage() {
  const menu = await getTodayMenu();

  // Fetch author info
  const supabase = createAdminClient();
  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor: AuthorInfo = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: "__admin__" };

  const profileMap: Record<string, AuthorInfo> = {};
  if (menu) {
    const memberIds = [menu.soup, menu.main, menu.side, menu.dessert]
      .map((r) => r?.submitted_by)
      .filter(Boolean) as string[];
    const uniqueIds = [...new Set(memberIds)];
    if (uniqueIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", uniqueIds);
      profiles?.forEach((p) => {
        profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username };
      });
    }
  }

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
            const author = recipe.submitted_by
              ? (profileMap[recipe.submitted_by] ?? adminAuthor)
              : adminAuthor;
            return <RecipeCard key={field} recipe={recipe} category={category} author={author} />;
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
