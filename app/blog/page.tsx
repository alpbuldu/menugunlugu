import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogCategories, getBlogPosts } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Blog",
  description: "Yemek kültürü, tarifler ve mutfak hikayeleri.",
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { kategori } = await searchParams;

  const [categories, posts] = await Promise.all([
    getBlogCategories(),
    getBlogPosts(kategori),
  ]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-8">Blog</h1>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              !kategori
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            Tümü
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?kategori=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                kategori === cat.slug
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-lg">
            {kategori ? "Bu kategoride henüz yazı yok." : "Henüz blog yazısı yok."}
          </p>
          {kategori && (
            <Link href="/blog" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
              Tüm yazılara dön
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
            >
              {/* Image */}
              <div className="relative h-48 bg-warm-100 shrink-0">
                {post.image_url ? (
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl text-warm-300">
                    ✍️
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                {post.category && (
                  <span className="inline-block self-start w-fit mb-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                    {post.category.name}
                  </span>
                )}
                <h2 className="text-base font-semibold text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-warm-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                <p className="text-xs text-warm-300 mt-auto pt-3">
                  {new Date(post.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
