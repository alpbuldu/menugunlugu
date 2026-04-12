import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogCategories, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Blog",
  description: "Yemek kültürü, tarifler ve mutfak hikayeleri.",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface Props {
  searchParams: Promise<{ kategori?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { kategori, page: pageParam } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username, avatar_url, full_name")
    .eq("id", 1)
    .maybeSingle();
  const authorName   = adminProfile?.username || "Menü Günlüğü";
  const authorAvatar = adminProfile?.avatar_url ?? "";

  const [categories, allPosts] = await Promise.all([
    getBlogCategories(),
    getBlogPosts(kategori),
  ]);

  const totalPages = Math.ceil(allPosts.length / PER_PAGE);
  const posts = allPosts.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  function href(overrides: { kategori?: string; page?: number }) {
    const p = new URLSearchParams();
    const kat = "kategori" in overrides ? overrides.kategori : kategori;
    if (kat) p.set("kategori", kat);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-8">Blog</h1>

      {/* Kategori filtreleri */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href={href({ kategori: undefined, page: 1 })}
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
              href={href({ kategori: cat.slug, page: 1 })}
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

      {/* Yazı ızgarası */}
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
                <div className="flex items-center gap-2 mt-auto pt-3">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600 flex-shrink-0">
                      {authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs text-warm-500 font-medium truncate">{authorName}</span>
                  <span className="text-warm-200 text-xs">·</span>
                  <span className="text-xs text-warm-300 flex-shrink-0">
                    {new Date(post.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
          {/* Önceki */}
          {currentPage > 1 ? (
            <Link
              href={href({ page: currentPage - 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Önceki sayfa"
            >
              ‹
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">
              ‹
            </span>
          )}

          {/* Sayfa numaraları */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = p === currentPage;
            const show =
              p === 1 ||
              p === totalPages ||
              Math.abs(p - currentPage) <= 1;
            const showEllipsisBefore = p === currentPage - 2 && currentPage - 2 > 1;
            const showEllipsisAfter  = p === currentPage + 2 && currentPage + 2 < totalPages;

            if (!show) return null;

            return (
              <span key={p} className="flex items-center gap-1.5">
                {showEllipsisBefore && (
                  <span className="text-warm-400 text-sm px-1">…</span>
                )}
                <Link
                  href={href({ page: p })}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                    isCurrent
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"
                  }`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {p}
                </Link>
                {showEllipsisAfter && (
                  <span className="text-warm-400 text-sm px-1">…</span>
                )}
              </span>
            );
          })}

          {/* Sonraki */}
          {currentPage < totalPages ? (
            <Link
              href={href({ page: currentPage + 1 })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Sonraki sayfa"
            >
              ›
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">
              ›
            </span>
          )}
        </div>
      )}
    </div>
  );
}
