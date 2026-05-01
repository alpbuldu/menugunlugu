import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug, getRelatedRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import dynamicImport from "next/dynamic";
import ShareButton from "@/components/ui/ShareButton";
import FollowButton from "@/components/ui/FollowButton";
import AdSlot from "@/components/ui/AdSlot";
import SidebarLayout from "@/components/ui/SidebarLayout";
import PagePopup from "@/components/ui/PagePopup";
import LazySection from "@/components/ui/LazySection";
// Etkileşimli client bileşenler — lazy load ile ilk hydration yükü azaltılıyor
const RatingStars    = dynamicImport(() => import("@/components/recipe/RatingStars"),    { ssr: false });
const FavoriteButton = dynamicImport(() => import("@/components/recipe/FavoriteButton"), { ssr: false });
const RecipeScaler   = dynamicImport(() => import("@/components/recipe/RecipeScaler"),   { ssr: false });
const RecipeActionBar = dynamicImport(() => import("@/components/recipe/RecipeActionBar"), { ssr: false });
const CommentSection  = dynamicImport(() => import("@/components/recipe/CommentSection"),  { ssr: false });

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
    alternates: { canonical: `/tarifler/${recipe.slug}` },
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

  // Takipçi sayısı
  let authorFollowerCount = 0;
  if (isAdminAuthor) {
    const { count } = await supabase
      .from("admin_follows")
      .select("follower_id", { count: "exact", head: true });
    authorFollowerCount = count ?? 0;
  } else if (authorUserId) {
    const { count } = await supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", authorUserId);
    authorFollowerCount = count ?? 0;
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

  // İlgili tarifler
  const relatedRecipes = await getRelatedRecipes(recipe.category, recipe.slug, 4);

  // Aksiyon barı istatistikleri
  const adminSb = (await import("@/lib/supabase/server")).createAdminClient();
  const [commentsCountRes, favoritesRes, ratingsRes, favoritedRes, userRatingRes, shareCountRes, userCommentedRes] = await Promise.all([
    adminSb.from("comments").select("id", { count: "exact", head: true }).eq("recipe_id", recipe.id),
    adminSb.from("favorites").select("recipe_id", { count: "exact", head: true }).eq("recipe_id", recipe.id),
    adminSb.from("ratings").select("score").eq("recipe_id", recipe.id),
    currentUserId
      ? adminSb.from("favorites").select("recipe_id").eq("recipe_id", recipe.id).eq("user_id", currentUserId).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId
      ? adminSb.from("ratings").select("score").eq("recipe_id", recipe.id).eq("user_id", currentUserId).maybeSingle()
      : Promise.resolve({ data: null }),
    adminSb.from("recipe_shares").select("id", { count: "exact", head: true }).eq("recipe_id", recipe.id),
    currentUserId
      ? adminSb.from("comments").select("id").eq("recipe_id", recipe.id).eq("user_id", currentUserId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const statCommentCount  = commentsCountRes.count ?? 0;
  const statFavoriteCount = favoritesRes.count ?? 0;
  const statInitFavorited = !!favoritedRes.data;
  const ratingScores      = (ratingsRes.data ?? []).map((r: any) => r.score as number);
  const statAvgRating     = ratingScores.length
    ? Math.round((ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length) * 10) / 10
    : 0;
  const statRatingCount   = ratingScores.length;
  const statUserRating      = (userRatingRes.data as any)?.score ?? 0;
  const statShareCount      = shareCountRes.count ?? 0;
  const statUserCommented   = !!userCommentedRes.data;

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
    url: `https://www.menugunlugu.com/tarifler/${recipe.slug}`,
  };

  return (
    <SidebarLayout placement="sidebar_recipe_detail" adSenseSlot="tarif_detay_dikey_masaustu">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Link href="/tarifler"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4">
        ← Tariflere dön
      </Link>

      {/* Mobil üst banner */}
      <AdSlot placement="recipe_detail_banner_mobile" adSenseSlot="tarif_detay_yatay_mobil"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero image */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image src={recipe.image_url!} alt={recipe.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">🍽️</div>
          )}
          <span className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold text-white">
            {({ soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı" } as Record<string, string>)[recipe.category as string] ?? recipe.category}
          </span>
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

        {/* Aksiyon barı */}
        <RecipeActionBar
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          commentCount={statCommentCount}
          favoriteCount={statFavoriteCount}
          avgRating={statAvgRating}
          ratingCount={statRatingCount}
          followerCount={authorFollowerCount}
          initialFavorited={statInitFavorited}
          isLoggedIn={!!currentUserId}
          targetUserId={isAdminAuthor ? undefined : authorUserId ?? undefined}
          isAdminProfile={isAdminAuthor}
          initialFollowing={initialFollowing}
          authorProfileHref={`/uye/${authorUsername}`}
          initialUserRating={statUserRating}
          shareCount={statShareCount}
          initialUserCommented={statUserCommented}
        />

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-warm-900 leading-snug">{recipe.title}</h1>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">🧂</span>
              Malzemeler
            </h2>
            <RecipeScaler
              ingredientsRaw={recipe.ingredients}
              isHtml={ingredientsIsHtml}
              servings={recipe.servings ?? null}
            />
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
            <p className="text-[11px] text-warm-400 mt-0.5">{authorRecipeCount} tarif · {authorFollowerCount} takipçi</p>
            <p className="text-[11px] text-brand-500 group-hover:underline">Tüm tarifleri gör →</p>
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
      <div id="puan" className="mt-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-6 flex items-center justify-between gap-4">
        <RatingStars recipeId={recipe.id} />
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <FavoriteButton recipeId={recipe.id} />
          {currentUserId && (
            <Link href="/uye/panel?tab=tarif-defterim" className="text-[11px] text-brand-500 hover:underline">
              Defterini gör →
            </Link>
          )}
        </div>
      </div>

      {/* Mobil reklam — yorumun üstünde */}
      <AdSlot placement="recipe_detail_banner_mobile" adSenseSlot="tarif_detay_yatay_mobil"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="mt-4 sm:hidden" />

      {/* Yorumlar — viewport'a girince yükle */}
      <div id="yorumlar">
        <LazySection
          className="mt-4"
          fallback={<div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 h-32 animate-pulse" />}
        >
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
            <CommentSection recipeId={recipe.id} currentUserId={currentUserId} />
          </div>
        </LazySection>
      </div>

      {/* Yatay reklam banneri — masaüstü */}
      <AdSlot placement="recipe_detail_banner" adSenseSlot="tarif_detay_yatay_masaustu"
        imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="mt-4 hidden sm:block" />

      {/* İlgili Tarifler — viewport'a girince göster */}
      {relatedRecipes.length > 0 && (
        <LazySection
          className="mt-10"
          fallback={<div className="h-40 animate-pulse rounded-2xl bg-warm-50" />}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-warm-800">Benzer Tarifler</h2>
              <Link href={`/tarifler/kategori/${
                { soup: "corbalar", main: "ana-yemekler", side: "yardimci-lezzetler", dessert: "tatlilar" }[recipe.category] ?? recipe.category
              }`} className="text-sm text-brand-600 hover:underline">
                Tümünü gör →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedRecipes.map((r) => (
                <Link key={r.id} href={`/tarifler/${r.slug}`}
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
        </LazySection>
      )}

      {/* Bottom nav */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/tarifler"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors">
          ← Tüm tariflere dön
        </Link>
        <ShareButton title={recipe.title} />
      </div>
    </div>
      <PagePopup page="tarif_detay" />
    </SidebarLayout>
  );
}
