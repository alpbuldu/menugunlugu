import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogCategories, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FollowButton from "@/components/ui/FollowButton";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdBanner from "@/components/ui/AdBanner";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getBlogCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Kategori bulunamadı" };
  return {
    title: `${cat.name} — Blog`,
    description: `${cat.name} kategorisindeki tüm yazıları keşfedin.`,
    alternates: { canonical: `/blog/kategori/${slug}` },
  };
}

interface UnifiedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  created_at: string;
  href: string;
  categoryName: string | null;
  authorName: string;
  authorAvatar: string;
  authorUsername: string;
  authorId: string | null;
  isAdminAuthor: boolean;
}

export default async function BlogKategoriPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const admin    = createAdminClient();

  const [adminProfileRes, categories, adminPosts] = await Promise.all([
    supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).maybeSingle(),
    getBlogCategories(),
    getBlogPosts(slug),
  ]);

  const activeCategory = categories.find((c) => c.slug === slug);
  if (!activeCategory) notFound();

  const adminProfile      = adminProfileRes.data;
  const adminAuthorName   = adminProfile?.username   ?? "Menü Günlüğü";
  const adminAuthorAvatar = adminProfile?.avatar_url ?? "";

  // Üye yazıları (bu kategori)
  const { data: memberPostsRaw } = await admin
    .from("member_posts")
    .select("id, title, slug, excerpt, image_url, created_at, submitted_by, category_id, blog_categories:category_id(name)")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false });

  const memberIds = [...new Set((memberPostsRaw ?? []).map((p: any) => p.submitted_by).filter(Boolean))];
  const memberProfileMap: Record<string, { username: string; avatar_url: string | null }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase
      .from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach((p) => { memberProfileMap[p.id] = { username: p.username, avatar_url: p.avatar_url ?? null }; });
  }

  const unifiedAdmin: UnifiedPost[] = adminPosts.map((p) => ({
    id:           p.id,
    title:        p.title,
    slug:         p.slug,
    excerpt:      p.excerpt ?? null,
    image_url:    p.image_url ?? null,
    created_at:   p.created_at,
    href:         `/blog/${p.slug}`,
    categoryName: p.category?.name ?? null,
    authorName:   adminAuthorName,
    authorAvatar: adminAuthorAvatar,
    authorUsername: "__admin__",
    authorId:     null,
    isAdminAuthor: true,
  }));

  const unifiedMember: UnifiedPost[] = (memberPostsRaw ?? [])
    .filter((p: any) => {
      const catName = (p.blog_categories as any)?.name ?? null;
      return catName === activeCategory.name;
    })
    .map((p: any) => {
      const profile = memberProfileMap[p.submitted_by] ?? null;
      return {
        id:           p.id,
        title:        p.title,
        slug:         p.slug,
        excerpt:      p.excerpt ?? null,
        image_url:    p.image_url ?? null,
        created_at:   p.created_at,
        href:         `/yazi/${p.slug}`,
        categoryName: (p.blog_categories as any)?.name ?? null,
        authorName:   profile?.username ?? "Üye",
        authorAvatar: profile?.avatar_url ?? "",
        authorUsername: profile?.username ?? "Üye",
        authorId:     p.submitted_by as string,
        isAdminAuthor: false,
      };
    });

  const allPosts: UnifiedPost[] = [...unifiedAdmin, ...unifiedMember]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalPages = Math.ceil(allPosts.length / PER_PAGE);
  const posts = allPosts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Takip durumu
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  let followsAdmin = false;
  const followedMemberIds = new Set<string>();
  if (currentUserId) {
    const memberAuthorIds = [...new Set(posts.filter((p) => !p.isAdminAuthor && p.authorId).map((p) => p.authorId as string))];
    const [adminFollowRes, memberFollowRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberAuthorIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberAuthorIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminFollowRes.data;
    (memberFollowRes.data ?? []).forEach((f: any) => followedMemberIds.add(f.following_id));
  }

  function buildPages(current: number, total: number): (number | "…")[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    pages.add(Math.max(1, current - 1));
    pages.add(current);
    pages.add(Math.min(total, current + 1));
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
      result.push(sorted[i]);
    }
    return result;
  }

  function pageHref(page: number) {
    if (page === 1) return `/blog/kategori/${slug}`;
    return `/blog/kategori/${slug}?page=${page}`;
  }

  return (
    <SidebarLayout placement="sidebar_blog">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-4">
        ← Blog
      </Link>

      <h1 className="text-3xl font-bold text-warm-900 mb-1">{activeCategory.name}</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4">
        {activeCategory.name} kategorisindeki yazılar
      </p>

      {/* Kategori filtreleri */}
      <div className="flex gap-1 sm:flex-wrap sm:gap-2 mb-4 sm:mb-8">
        <Link
          href="/blog"
          className="flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
        >
          Tümü
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog/kategori/${cat.slug}`}
            className={`flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
              cat.slug === slug
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Reklam */}
      <AdBanner placement="blog_banner" imageHeight="h-[100px]" className="hidden sm:block mb-8" />
      <AdBanner placement="blog_banner_mobile" imageHeight="h-[70px]" className="sm:hidden mb-4" />

      {/* Yazı listesi */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-lg">Bu kategoride henüz yazı yok.</p>
          <Link href="/blog" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Tüm yazılara dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const initialFollowing = post.isAdminAuthor
              ? followsAdmin
              : post.authorId ? followedMemberIds.has(post.authorId) : false;
            return (
              <div
                key={post.id}
                className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <Link href={post.href} className="flex flex-col flex-1">
                  <div className="relative h-48 bg-warm-100 shrink-0">
                    {post.image_url ? (
                      <Image src={post.image_url} alt={post.title} fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl text-warm-300">✍️</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {post.categoryName && (
                      <span className="inline-block self-start w-fit mb-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                        {post.categoryName}
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
                    <p className="text-xs text-warm-300 mt-auto pt-3 flex-shrink-0">
                      {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 px-4 pb-3 pt-2 border-t border-warm-100">
                  <Link href={`/uye/${post.authorUsername}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity group/author">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.authorName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600 flex-shrink-0">
                        {post.authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-warm-300 leading-none mb-0.5">Yazar</span>
                      <span className="text-xs font-medium text-warm-500 group-hover/author:text-brand-600 transition-colors truncate">{post.authorName}</span>
                    </div>
                  </Link>
                  <FollowButton
                    targetUserId={post.isAdminAuthor ? undefined : post.authorId ?? undefined}
                    isAdminProfile={post.isAdminAuthor}
                    initialFollowing={initialFollowing}
                    isLoggedIn={!!currentUserId}
                    size="xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Önceki sayfa">‹</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">‹</span>
          )}

          {buildPages(currentPage, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="text-warm-400 text-sm px-1">…</span>
            ) : (
              <Link key={p} href={pageHref(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors border ${
                  p === currentPage
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"
                }`}>
                {p}
              </Link>
            )
          )}

          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors"
              aria-label="Sonraki sayfa">›</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">›</span>
          )}
        </div>
      )}
    </div>
    </SidebarLayout>
  );
}
