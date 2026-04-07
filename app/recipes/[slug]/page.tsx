import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/lib/supabase/queries";
import type { Category } from "@/lib/types";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return { title: "Tarif bulunamadı" };
  const metaTitle   = recipe.seo_title ?? recipe.title;
  const description = recipe.description ?? `${recipe.title} tarifi — malzemeler ve yapılışı.`;
  return {
    title:    metaTitle,
    description,
    keywords: recipe.seo_keywords ?? undefined,
    openGraph: {
      title: metaTitle,
      description,
      images: recipe.image_url ? [recipe.image_url] : [],
    },
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const ingredients = recipe.ingredients
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const steps = recipe.instructions
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

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
            <ul className="bg-warm-50 rounded-xl p-5 space-y-2.5">
              {ingredients.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-warm-700 text-sm"
                >
                  <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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

      {/* Bottom nav */}
      <div className="mt-8 text-center">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors"
        >
          ← Tüm tariflere dön
        </Link>
      </div>
    </div>
  );
}
