import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug, getRandomRecipes, getRelatedRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/ui/ShareButton";
import RatingStars from "@/components/recipe/RatingStars";
import FavoriteButton from "@/components/recipe/FavoriteButton";
import FollowButton from "@/components/ui/FollowButton";
import RecipeSlider from "@/components/ui/RecipeSlider";
import AdBanner from "@/components/ui/AdBanner";
import SidebarLayout from "@/components/ui/SidebarLayout";
import CommentSection from "@/components/recipe/CommentSection";

const DEFAULT_OG = "https://www.menugunlugu.com/opengraph-image";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return { title: "Tarif bulunamadı" };
  const CATEGORY_LABELS: Record<string, string> = {
    soup: "çorba", main: "ana yemek", side: "yardımcı lezzet", dessert: "tatlı",
  };
  const catLabel    = CATEGORY_LABELS[recipe.category] ?? recipe.category;
  const metaTitle   = recipe.seo_title ?? recipe.title;
  const description = recipe.description ?? `${recipe.title} tarifi — malzemeler ve yapılışı.`;
  const keywords    = recipe.seo_keywords ?? `${recipe.title}, ${recipe.title} tarifi, ${catLabel} tarifi, evde ${catLabel}, kolay ${catLabel}, Menü Günlüğü`;
  return {
    title:    metaTitle,
    description,
    keywords,
    openGraph: {
      title:       metaTitle,
      description,
      type:        "article",
      images:      [{ url: recipe.image_url ?? DEFAULT_OG, width: 1200, height: 630, alt: recipe.title }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       metaTitle,
      description,
      images:      [recipe.image_url ?? DEFAULT_OG],
    },
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Yazar bilgisi
  let authorName       = "Menü Günlüğü";
  let authorAvatar     = "";
  let authorUsername   = "__admin__";
  let authorBio        = "";
  let authorFullName   = "";
  let authorRecipeCount = 0;
  let authorUserId: string | null = null;
  let isAdminAuthor    = true;

  if ((recipe as any).submitted_by) {
    isAdminAuthor = false;
    authorUserId  = (recipe as any).submitted_by;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name, bio")
      .eq("id", authorUserId!)
      .single();
    if (profile) {
      authorName     = profile.username;
      authorAvatar   = profile.avatar_url ?? "";
      authorUsername = profile.username;
      authorBio      = profile.bio ?? "";
      authorFullName = profile.full_name ?? "";
    }
    const { count } = await supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", authorUserId!)
      .eq("approval_status", "approved");
    authorRecipeCount = count ?? 0;
  } else {
    const { data: adminProfile } = await supabase
      .from("admin_profile")
      .select("username, avatar_url, full_name, bio")
      .eq("id", 1)
      .single();
    if (adminProfile) {
      authorName     = adminProfile.username;
      authorAvatar   = adminProfile.avatar_url ?? "";
      authorBio      = (adminProfile as any).bio ?? "";
      authorFullName = (adminProfile as any).full_name ?? "";
    }
    const { count } = await supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .is("submitted_by", null);
    authorRecipeCount = count ?? 0;
  }

  // Takip durumu
  let initialFollowing = false;
  if (currentUserId) {
    if (isAdminAuthor) {
      const { data } = await supabase
        .from("admin_follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .maybeSingle();
      initialFollowing = !!data;
    } else if (authorUserId) {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", authorUserId)
        .maybeSingle();
      initialFollowing = !!data;
    }
  }

  // Öne çıkan tarifler (slider) + ilgili tarifler
  const [featured, adminProfileForSlider, relatedRecipes] = await Promise.all([
    getRandomRecipes(),
    supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single(),
    getRelatedRecipes(recipe.category, recipe.slug, 4),
  ]);
  const ap = adminProfileForSlider.data;
  const adminAuthor = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: "__admin__" };
  const memberIds = [...new Set(featured.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const profileMap: Record<string, { name: string; avatar: string; username: string }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach((p) => { profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username }; });
  }

  // Slider follow durumu
  let sliderFollowsAdmin = false;
  const sliderFollowMap: Record<string, boolean> = {};
  if (currentUserId && featured.length > 0) {
    const [adminFollowRes, memberFollowRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    sliderFollowsAdmin = !!adminFollowRes.data;
    (memberFollowRes.data ?? []).forEach((r: { following_id: string }) => { sliderFollowMap[r.following_id] = true; });
  }

  // Malzemeler
  const ingredientsIsHtml = recipe.ingredients.trim().startsWith("<");
  type IngredientItem = { type: "heading"; text: string } | { type: "item"; text: string };
  function parseIngredients(html: string): IngredientItem[] {
    const result: IngredientItem[] = [];
    const flat = html
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n__H__$1\n")
      .replace(/<\/?(ul|ol|div)[^>]*>/gi, "")
      .replace(/<(p|li)[^>]*>/gi, "\n")
      .replace(/<\/(p|li)>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    for (const raw of flat.split("\n")) {
      const line = raw.replace(/&nbsp;/g, "").trim();
      if (!line) continue;
      if (line.startsWith("__H__")) {
        const heading = line.slice(5).trim();
        if (heading) result.push({ type: "heading", text: heading });
      } else {
        result.push({ type: "item", text: line });
      }
    }
    return result;
  }
  const ingredients = ingredientsIsHtml
    ? null
    : recipe.ingredients.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const instructionsIsHtml = recipe.instructions.trim().startsWith("<");
  function parseInstructions(html: string): string[] {
    const flat = html
      .replace(/<\/?(ul|ol|div)[^>]*>/gi, "")
      .replace(/<(p|li)[^>]*>/gi, "\n")
      .replace(/<\/(p|li)>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    return flat.split("\n").map((s) => s.replace(/&nbsp;/g, "").trim()).filter(Boolean);
  }
  const steps = instructionsIsHtml
    ? parseInstructions(recipe.instructions)
    : recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);

  const hasImage = recipe.image_url && recipe.image_url.trim() !== "";

  const ingredientLines = recipe.ingredients
    .split("\n").map((s) => s.trim()).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description ?? `${recipe.title} tarifi — malzemeler ve yapılışı.`,
    image: recipe.image_url ? [recipe.image_url] : undefined,
    author: { "@type": "Person", name: authorName },
    datePublished: recipe.created_at,
    recipeCategory: recipe.category,
    recipeYield: recipe.servings ? `${recipe.servings} kişilik` : undefined,
    recipeIngredient: ingredientLines,
    recipeInstructions: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step,
    })),
    aggregateRating: undefined as undefined,
    url: `https://www.menugunlugu.com/recipes/${recipe.slug}`,
  };

  return (
    <SidebarLayout placement="sidebar_recipe_detail">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Link href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4">
        ← Tariflere dön
      </Link>

      {/* Mobil üst banner */}
      <AdBanner placement="recipe_detail_banner_mobile" imageHeight="h-[70px]" className="sm:hidden mb-4" />

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero image */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image src={recipe.image_url!} alt={recipe.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">🍽️</div>
          )}
          <Link
            href={`/uye/${authorUsername}`}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors rounded-full px-2.5 py-1"
          >
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-brand-400 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-[10px] text-white/60 font-medium">Yazar:</span>
            <span className="text-[10px] font-semibold text-white">{authorName}</span>
          </Link>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge category={recipe.category as Category} />
                {recipe.servings && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-100 text-warm-600">
                    👤 {recipe.servings} kişilik
                  </span>
                )}
              </div>
              {/* Mobilde ikon, masaüstünde yazılı butonlar */}
              <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
                <FollowButton
                  targetUserId={isAdminAuthor ? undefined : authorUserId ?? undefined}
                  isAdminProfile={isAdminAuthor}
                  initialFollowing={initialFollowing}
                  isLoggedIn={!!currentUserId}
                  size="icon"
                />
                <FavoriteButton recipeId={recipe.id} compact />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 hidden sm:flex">
                <FollowButton
                  targetUserId={isAdminAuthor ? undefined : authorUserId ?? undefined}
                  isAdminProfile={isAdminAuthor}
                  initialFollowing={initialFollowing}
                  isLoggedIn={!!currentUserId}
                  size="sm"
                />
                <FavoriteButton recipeId={recipe.id} />
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-warm-900 mt-3 leading-snug">{recipe.title}</h1>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">🧂</span>
              Malzemeler
            </h2>
            {ingredientsIsHtml ? (
              <div className="bg-warm-50 rounded-xl p-5 space-y-1">
                {parseIngredients(recipe.ingredients).map((item, i) =>
                  item.type === "heading" ? (
                    <h3 key={i} className="text-sm font-bold text-warm-800 border-b border-warm-200 pb-1 mt-4 mb-0 first:mt-0">{item.text}</h3>
                  ) : (
                    <div key={i} className="flex items-start gap-2.5 text-warm-700 text-sm py-0.5">
                      <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                      <span>{item.text}</span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <ul className="bg-warm-50 rounded-xl p-5 space-y-2.5">
                {ingredients!.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-warm-700 text-sm">
                    <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">👨‍🍳</span>
              Yapılışı
            </h2>
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4 text-sm text-warm-700">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Yazar kartı */}
      <div className="mt-4 flex items-center gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm px-6 py-4">
        <Link href={`/uye/${authorUsername}`} className="flex items-center gap-4 flex-1 min-w-0 group">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorFullName || authorName}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-warm-100" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-lg font-bold text-brand-600 flex-shrink-0 ring-2 ring-warm-100">
              {(authorFullName || authorName).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-warm-400">Bu tarifi hazırlayan</p>
            <p className="font-semibold text-warm-900 text-sm group-hover:text-brand-700 transition-colors leading-tight">
              {authorFullName || authorName}
            </p>
            {authorFullName && <p className="text-[11px] text-warm-400">@{authorName}</p>}
            <p className="text-[11px] text-warm-400 mt-0.5">{authorRecipeCount} tarif · Tüm tarifleri gör →</p>
          </div>
        </Link>
        <FollowButton
          targetUserId={isAdminAuthor ? undefined : authorUserId ?? undefined}
          isAdminProfile={isAdminAuthor}
          initialFollowing={initialFollowing}
          isLoggedIn={!!currentUserId}
        />
      </div>

      {/* Rating + Favorite */}
      <div className="mt-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <RatingStars recipeId={recipe.id} />
        <FavoriteButton recipeId={recipe.id} />
      </div>

      {/* Mobil reklam — yorumun üstünde */}
      <AdBanner placement="recipe_detail_banner_mobile" imageHeight="h-[70px]" className="mt-4 sm:hidden" />

      {/* Yorumlar */}
      <div className="mt-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
        <CommentSection recipeId={recipe.id} currentUserId={currentUserId} />
      </div>

      {/* Yatay reklam banneri — masaüstü */}
      <AdBanner placement="recipe_detail_banner" imageHeight="h-[100px]" className="mt-4 hidden sm:block" />

      {/* Öne Çıkan Tarifler slider */}
      {featured.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-800">Öne Çıkan Tarifler</h2>
            <Link href="/recipes" className="text-sm text-brand-600 hover:underline">
              Tüm tarifleri gör →
            </Link>
          </div>
          <RecipeSlider
            recipes={featured}
            adminAuthor={adminAuthor}
            profileMap={profileMap}
            compact
            isLoggedIn={!!currentUserId}
            followMap={sliderFollowMap}
            followsAdmin={sliderFollowsAdmin}
          />
        </div>
      )}

      {/* İlgili Tarifler */}
      {relatedRecipes.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-800">Benzer Tarifler</h2>
            <Link href={`/recipes?category=${recipe.category}`} className="text-sm text-brand-600 hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedRecipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.slug}`}
                className="group bg-white rounded-xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-28 bg-warm-100">
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.title} fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl text-warm-300">🍽️</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-warm-800 line-clamp-2 leading-snug">{r.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/recipes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors">
          ← Tüm tariflere dön
        </Link>
        <ShareButton title={recipe.title} />
      </div>
    </div>
    </SidebarLayout>
  );
}
