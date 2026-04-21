import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ui/ShareButton";
import FollowButton from "@/components/ui/FollowButton";
import AdBanner from "@/components/ui/AdBanner";
import SidebarLayout from "@/components/ui/SidebarLayout";
import BlogFavoriteButton from "@/components/blog/BlogFavoriteButton";
import BlogRatingStars from "@/components/blog/BlogRatingStars";
import BlogCommentSection from "@/components/blog/BlogCommentSection";
import ProseContent from "@/components/blog/ProseContent";
import LazySection from "@/components/ui/LazySection";

const DEFAULT_OG = "https://www.menugunlugu.com/opengraph-image";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Yazı Bulunamadı" };
  const metaTitle   = post.seo_title ?? post.title;
  const description = post.excerpt ?? post.content.replace(/<[^>]+>/g, "").slice(0, 155);
  const catName     = post.category?.name;
  const keywords    = post.seo_keywords ??
    [post.title, catName, "yemek blogu", "mutfak", "Menü Günlüğü"].filter(Boolean).join(", ");
  return {
    title:    metaTitle,
    description,
    keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title:         metaTitle,
      description,
      type:          "article",
      publishedTime: post.created_at,
      images:        [{ url: post.image_url ?? DEFAULT_OG, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       metaTitle,
      description,
      images:      [post.image_url ?? DEFAULT_OG],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const hasImage = !!post.image_url;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const [adminProfileRes, postCountRes, followerCountRes] = await Promise.all([
    supabase.from("admin_profile").select("username, avatar_url, full_name").eq("id", 1).single(),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("admin_follows").select("follower_id", { count: "exact", head: true }),
  ]);
  const adminProfile    = adminProfileRes.data;
  const authorFullName  = (adminProfile as any)?.full_name ?? "";
  const authorHandle    = adminProfile?.username ?? "hikayeliyemekler";
  const authorName      = authorHandle;
  const authorAvatar    = adminProfile?.avatar_url ?? "";
  const authorPostCount     = postCountRes.count ?? 0;
  const authorFollowerCount = followerCountRes.count ?? 0;
  const authorUsername  = "__admin__";

  // Takip durumu (admin)
  let initialFollowing = false;
  if (currentUserId) {
    const { data } = await supabase
      .from("admin_follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .maybeSingle();
    initialFollowing = !!data;
  }

  // Benzer blog yazıları
  const relatedPosts = await (post.category_id ? getRelatedBlogPosts(post.category_id, post.slug, 3) : Promise.resolve([]));

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.content.replace(/<[^>]+>/g, "").slice(0, 155),
    image: post.image_url ? [post.image_url] : undefined,
    author: { "@type": "Person", name: authorName, url: `https://www.menugunlugu.com/uye/${authorUsername}` },
    publisher: {
      "@type": "Organization",
      name: "Menü Günlüğü",
      logo: { "@type": "ImageObject", url: "https://www.menugunlugu.com/logo.png" },
    },
    datePublished: post.created_at,
    dateModified: post.created_at,
    mainEntityOfPage: `https://www.menugunlugu.com/blog/${post.slug}`,
    articleSection: post.category?.name,
    url: `https://www.menugunlugu.com/blog/${post.slug}`,
  };

  return (
    <SidebarLayout placement="sidebar_blog_post">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Link href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4">
        ← Blog
      </Link>

      {/* Mobil üst banner */}
      <AdBanner placement="blog_post_banner_mobile" imageHeight="h-[70px]" className="sm:hidden mb-4" />

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero image */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image src={post.image_url!} alt={post.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">✍️</div>
          )}
          {/* Yazar etiketi — sağ alt, recipe detail ile aynı stil */}
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
            {/* Üst satır: kategori SOL, butonlar SAĞ */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {post.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                    {post.category.name}
                  </span>
                )}
              </div>

              {/* Mobil: ikon butonlar */}
              <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
                <FollowButton
                  isAdminProfile={true}
                  initialFollowing={initialFollowing}
                  isLoggedIn={!!currentUserId}
                  size="icon"
                />
                <BlogFavoriteButton postId={post.id} compact />
                <ShareButton title={post.title} compact />
              </div>

              {/* Masaüstü: yazılı butonlar */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <FollowButton
                  isAdminProfile={true}
                  initialFollowing={initialFollowing}
                  isLoggedIn={!!currentUserId}
                  size="sm"
                />
                <BlogFavoriteButton postId={post.id} />
                <ShareButton title={post.title} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 leading-snug">{post.title}</h1>
            <p className="text-sm text-warm-400 mt-2">
              {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {post.excerpt && (
            <p className="text-warm-500 text-base leading-relaxed mb-6 pb-6 border-b border-warm-100 font-medium">
              {post.excerpt}
            </p>
          )}

          {post.content.trimStart().startsWith("<") ? (
            <ProseContent html={post.content} />
          ) : (
            <div className="text-warm-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}
        </div>
      </div>

      {/* Yazar kartı */}
      <div className="mt-4 flex items-center gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
        <Link href={`/uye/${authorUsername}?tab=yazilar`} className="flex items-center gap-4 flex-1 min-w-0 group">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-warm-100" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-lg font-bold text-brand-600 flex-shrink-0 ring-2 ring-warm-100">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-warm-400">Bu yazının sahibi</p>
            <p className="font-semibold text-warm-900 text-sm group-hover:text-brand-700 transition-colors leading-tight">{authorName}</p>
            {authorFullName && <p className="text-[11px] text-warm-400">@{authorHandle}</p>}
            <p className="text-[11px] text-warm-400 mt-0.5">{authorPostCount} yazı · {authorFollowerCount} takipçi</p>
            <p className="text-[11px] text-brand-500 group-hover:underline">Tüm yazıları gör →</p>
          </div>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <FollowButton
            isAdminProfile={true}
            initialFollowing={initialFollowing}
            isLoggedIn={!!currentUserId}
          />
        </div>
      </div>

      {/* Puanlama + Deftere Ekle */}
      <div className="mt-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-6 flex items-center justify-between gap-4">
        <BlogRatingStars postId={post.id} />
        <BlogFavoriteButton postId={post.id} />
      </div>

      {/* Mobil reklam — yorumun üstünde */}
      <AdBanner placement="blog_post_banner_mobile" imageHeight="h-[70px]" className="mt-4 sm:hidden" />

      {/* Yorumlar — viewport'a girince yükle */}
      <LazySection
        className="mt-4"
        fallback={<div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6 h-32 animate-pulse" />}
      >
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
          <BlogCommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      </LazySection>

      {/* Yatay reklam banneri — masaüstü */}
      <AdBanner placement="blog_post_banner" imageHeight="h-[100px]" className="mt-4 hidden sm:block" />

      {/* Benzer Yazılar — viewport'a girince göster */}
      {relatedPosts.length > 0 && (
        <LazySection
          className="mt-10"
          fallback={<div className="h-40 animate-pulse rounded-2xl bg-warm-50" />}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-warm-800">Benzer Yazılar</h2>
              {post.category && (
                <Link href={`/blog/kategori/${post.category.slug}`} className="text-sm text-brand-600 hover:underline">
                  Tümünü gör →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`}
                  className="group bg-white rounded-xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-36 bg-warm-100">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.title} fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl text-warm-300">✍️</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-warm-800 line-clamp-2 leading-snug">{p.title}</p>
                    <p className="text-[11px] text-warm-400 mt-1">
                      {new Date(p.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* Bottom nav */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors">
          ← Tüm yazılara dön
        </Link>
        <ShareButton title={post.title} />
      </div>
    </div>
    </SidebarLayout>
  );
}
