import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import ShareButton from "@/components/ui/ShareButton";
import RatingStars from "@/components/recipe/RatingStars";
import FavoriteButton from "@/components/recipe/FavoriteButton";
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

  // Current user (for comments + favorites)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Malzemeler: HTML editörden mi yoksa eski düz metin mi?
  const ingredientsIsHtml = recipe.ingredients.trim().startsWith("<");

  // HTML malzeme içeriğini parse et: başlık veya malzeme satırı
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
      const line = raw.trim();
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

  // Yapılış: her zaman düz metin olarak göster (turuncu numaralı daire)
  const steps = recipe.instructions.trim().startsWith("<")
    ? [] // eski HTML formatı varsa boş bırak (güvenlik)
    : recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);

  const hasImage = recipe.image_url && recipe.image_url.trim() !== "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6"
      >
        ← Tariflere dön
      </Link>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero image */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image
              src={recipe.image_url!}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">
              🍽️
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge category={recipe.category as Category} />
              {recipe.servings && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-100 text-warm-600">
                  👤 {recipe.servings} kişilik
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 mt-3 leading-snug">
              {recipe.title}
            </h1>
          </div>

          {/* Ingredients */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-sm">🧂</span>
              Malzemeler
            </h2>
            {ingredientsIsHtml ? (
              <div className="bg-warm-50 rounded-xl p-5 space-y-1">
                {parseIngredients(recipe.ingredients).map((item, i) =>
                  item.type === "heading" ? (
                    <h3 key={i} className="text-sm font-bold text-warm-800 border-b border-warm-200 pb-1 mt-4 mb-1 first:mt-0">
                      {item.text}
                    </h3>
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

          {/* Instructions */}
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
                  <span className="pt-0.5 leading-relaxed">
                    {step.replace(/^\d+\.\s*/, "")}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Rating + Favorite */}
      <div className="mt-6 bg-white rounded-2xl border border-warm-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <RatingStars recipeId={recipe.id} />
        <FavoriteButton recipeId={recipe.id} />
      </div>

      {/* Comments */}
      <div className="mt-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
        <CommentSection recipeId={recipe.id} currentUserId={currentUserId} />
      </div>

      {/* Bottom nav */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors"
        >
          ← Tüm tariflere dön
        </Link>
        <ShareButton title={recipe.title} />
      </div>
    </div>
  );
}
