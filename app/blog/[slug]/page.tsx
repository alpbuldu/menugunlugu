import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/supabase/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Yazı Bulunamadı" };
  return {
    title: post.title,
    description: post.excerpt ?? post.content.slice(0, 150),
    openGraph: {
      title: post.title,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const hasImage = !!post.image_url;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6"
      >
        ← Blog
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero image */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image
              src={post.image_url!}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">
              ✍️
            </div>
          )}
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            {post.category && (
              <span className="inline-block self-start w-fit mb-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                {post.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-warm-900 leading-snug">
              {post.title}
            </h1>
            <p className="text-sm text-warm-400 mt-2">
              {new Date(post.created_at).toLocaleDateString("tr-TR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-warm-500 text-base leading-relaxed mb-6 pb-6 border-b border-warm-100 font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className="text-warm-700 text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors"
        >
          ← Tüm yazılara dön
        </Link>
      </div>
    </div>
  );
}
