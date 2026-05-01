import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "İstatistikler" };
export const revalidate = 300; // 5 dk cache

const CAT_LABEL: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};
const CAT_COLOR: Record<string, string> = {
  soup: "bg-blue-50 text-blue-700 border-blue-100",
  main: "bg-orange-50 text-orange-700 border-orange-100",
  side: "bg-green-50 text-green-700 border-green-100",
  dessert: "bg-pink-50 text-pink-700 border-pink-100",
};

function badge(cat: string) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CAT_COLOR[cat] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
      {CAT_LABEL[cat] ?? cat}
    </span>
  );
}

interface RecipeRow {
  id: string;
  title: string;
  slug: string;
  category: string;
}

interface StatRow {
  recipe_id: string;
  score?: number;
}

function aggregate(rows: StatRow[]): Record<string, { count: number; total: number }> {
  const map: Record<string, { count: number; total: number }> = {};
  for (const r of rows) {
    if (!map[r.recipe_id]) map[r.recipe_id] = { count: 0, total: 0 };
    map[r.recipe_id].count++;
    map[r.recipe_id].total += r.score ?? 0;
  }
  return map;
}

function topN(
  map: Record<string, { count: number; total: number }>,
  recipes: RecipeRow[],
  n = 10,
  useAvg = false,
): { recipe: RecipeRow; value: number; count: number }[] {
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));
  return Object.entries(map)
    .map(([id, { count, total }]) => ({
      recipe: recipeMap[id],
      value: useAvg ? (count > 0 ? total / count : 0) : count,
      count,
    }))
    .filter(x => x.recipe)
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, n);
}

/* ── Genel toplam istatistikler ── */
async function fetchTotals(supabase: ReturnType<typeof createAdminClient>) {
  const [recipes, menus, favorites, ratings, comments, shares, blog, users] = await Promise.all([
    supabase.from("recipes").select("id", { count: "exact", head: true }),
    supabase.from("menus").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("favorites").select("*", { count: "exact", head: true }),
    supabase.from("ratings").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("recipe_shares").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    recipes:   recipes.count  ?? 0,
    menus:     menus.count    ?? 0,
    favorites: favorites.count ?? 0,
    ratings:   ratings.count  ?? 0,
    comments:  comments.count ?? 0,
    shares:    shares.count   ?? 0,
    blog:      blog.count     ?? 0,
    users:     users.count    ?? 0,
  };
}

export default async function IstatistiklerPage() {
  const supabase = createAdminClient();

  const [
    totals,
    { data: recipes },
    { data: favData },
    { data: ratingData },
    { data: commentData },
    { data: shareData },
  ] = await Promise.all([
    fetchTotals(supabase),
    supabase.from("recipes").select("id, title, slug, category"),
    supabase.from("favorites").select("recipe_id"),
    supabase.from("ratings").select("recipe_id, score"),
    supabase.from("comments").select("recipe_id"),
    supabase.from("recipe_shares").select("recipe_id"),
  ]);

  const allRecipes = (recipes ?? []) as RecipeRow[];

  const favMap     = aggregate((favData     ?? []) as StatRow[]);
  const ratingMap  = aggregate((ratingData  ?? []) as StatRow[]);
  const commentMap = aggregate((commentData ?? []) as StatRow[]);
  const shareMap   = aggregate((shareData   ?? []) as StatRow[]);

  const topFav     = topN(favMap,     allRecipes, 10);
  const topRating  = topN(ratingMap,  allRecipes, 10, true);
  const topComment = topN(commentMap, allRecipes, 10);
  const topShare   = topN(shareMap,   allRecipes, 10);

  const STAT_CARDS = [
    { label: "Toplam Tarif",   value: totals.recipes,   icon: "🍳" },
    { label: "Yayınlı Menü",   value: totals.menus,     icon: "📅" },
    { label: "Blog Yazısı",    value: totals.blog,      icon: "✍️" },
    { label: "Üye",            value: totals.users,     icon: "👥" },
    { label: "Favori",         value: totals.favorites, icon: "🔖" },
    { label: "Puan",           value: totals.ratings,   icon: "⭐" },
    { label: "Yorum",          value: totals.comments,  icon: "💬" },
    { label: "Paylaşım",       value: totals.shares,    icon: "📤" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-warm-900">İstatistikler</h1>

      {/* ── Genel sayaçlar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4 flex flex-col gap-1">
            <div className="text-2xl">{icon}</div>
            <div className="text-2xl font-bold text-warm-900">{value.toLocaleString("tr-TR")}</div>
            <div className="text-xs text-warm-400">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tarif sıralamaları ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Favoriler */}
        <StatTable
          title="🔖 En Çok Favorilenen"
          rows={topFav}
          valueLabel="Favori"
          format={v => v.toLocaleString("tr-TR")}
        />

        {/* Puanlar */}
        <StatTable
          title="⭐ En Yüksek Puanlı"
          rows={topRating}
          valueLabel="Ort. puan"
          format={v => v.toFixed(1)}
          subLabel={r => `${r.count} oy`}
        />

        {/* Yorumlar */}
        <StatTable
          title="💬 En Çok Yorum Alan"
          rows={topComment}
          valueLabel="Yorum"
          format={v => v.toLocaleString("tr-TR")}
        />

        {/* Paylaşımlar */}
        <StatTable
          title="📤 En Çok Paylaşılan"
          rows={topShare}
          valueLabel="Paylaşım"
          format={v => v.toLocaleString("tr-TR")}
        />

      </div>
    </div>
  );
}

/* ── Alt bileşen: Sıralama tablosu ── */
function StatTable({
  title,
  rows,
  valueLabel,
  format,
  subLabel,
}: {
  title: string;
  rows: { recipe: RecipeRow; value: number; count: number }[];
  valueLabel: string;
  format: (v: number) => string;
  subLabel?: (r: { value: number; count: number }) => string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-warm-50">
        <h2 className="font-bold text-warm-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-sm text-warm-400 text-center">Henüz veri yok</div>
      ) : (
        <ol className="divide-y divide-warm-50">
          {rows.map(({ recipe, value, count }, i) => (
            <li key={recipe.id} className="flex items-center gap-3 px-5 py-3 hover:bg-warm-50 transition-colors">
              {/* Sıra */}
              <span className={`text-sm font-bold w-6 text-center shrink-0 ${i === 0 ? "text-brand-600" : i === 1 ? "text-warm-500" : i === 2 ? "text-warm-400" : "text-warm-300"}`}>
                {i + 1}
              </span>
              {/* Kategori */}
              {badge(recipe.category)}
              {/* Tarif adı */}
              <Link
                href={`/tarifler/${recipe.slug}`}
                target="_blank"
                className="flex-1 text-sm text-warm-800 hover:text-brand-700 truncate"
              >
                {recipe.title}
              </Link>
              {/* Değer */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-warm-900">{format(value)}</div>
                {subLabel && (
                  <div className="text-[10px] text-warm-400">{subLabel({ value, count })}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
