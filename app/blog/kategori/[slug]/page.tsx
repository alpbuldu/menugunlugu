import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogCategories, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdBanner from "@/components/ui/AdBanner";
import PageHeader from "@/components/ui/PageHeader";
import PagePopup from "@/components/ui/PagePopup";

export const dynamic = "force-dynamic";

const PER_PAGE = 9;

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

  function buildPages(current: number, total: number): number[] {
    const WINDOW = 3;
    let start = Math.max(1, current - Math.floor(WINDOW / 2));
    let end   = Math.min(total, start + WINDOW - 1);
    if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  function pageHref(page: number) {
    if (page === 1) return `/blog/kategori/${slug}`;
    return `/blog/kategori/${slug}?page=${page}`;
  }

  return (
    <SidebarLayout placement="sidebar_blog">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <PageHeader
        title="Blog"
        description="Mutfak rehberleri, püf noktaları, sağlıklı beslenme ve gastronomi içeriklerini keşfet."
      />

      {/* Kategori filtreleri */}
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <span className="text-sm font-bold text-warm-800 flex-shrink-0 hidden sm:block">Kategoriler:</span>
          <Link
            href="/blog"
            className="flex-1 sm:flex-none flex items-center justify-center min-h-[34px] py-1 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
          >
            Tümü
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog/kategori/${cat.slug}`}
              className={`flex-1 sm:flex-none flex items-center justify-center min-h-[34px] py-1 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
                cat.slug === slug
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={post.href}
              className="relative block rounded-xl sm:rounded-2xl overflow-hidden h-44 sm:h-64 group hover:shadow-lg transition-all"
            >
              {post.image_url ? (
                <Image src={post.image_url} alt={post.title} fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={index < 4} />
              ) : (
                <div className="absolute inset-0 bg-warm-100 flex items-center justify-center text-4xl text-warm-300">✍️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {post.categoryName && (
                <span className="absolute top-2.5 left-2.5 hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500 text-white">
                  {post.categoryName}
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-2xl p-3 sm:p-4 overflow-hidden">
                <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 mb-1.5">{post.title}</h2>
                {post.excerpt && <p className="text-[9px] sm:text-[10px] text-white/65 line-clamp-1 sm:line-clamp-2 mb-1.5">{post.excerpt}</p>}
                <div className="flex items-center gap-1.5 min-w-0">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.authorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {post.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[11px] sm:text-xs text-white/80 truncate min-w-0">{post.authorName}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (() => {
        const btn      = "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium border transition-colors";
        const inactive = `${btn} bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600`;
        const active   = `${btn} bg-brand-600 border-brand-600 text-white`;
        const dis      = `${btn} border-warm-100 text-warm-300 cursor-default`;
        const pages    = buildPages(currentPage, totalPages);
        return (
          <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
            {currentPage > 1 ? <Link href={pageHref(1)}                  className={inactive}>«</Link> : <span className={dis}>«</span>}
            {currentPage > 1 ? <Link href={pageHref(currentPage - 1)}    className={inactive}>‹</Link> : <span className={dis}>‹</span>}
            {pages.map((p) => (
              <Link key={p} href={pageHref(p)} aria-current={p === currentPage ? "page" : undefined}
                className={p === currentPage ? active : inactive}>{p}</Link>
            ))}
            {currentPage < totalPages ? <Link href={pageHref(currentPage + 1)} className={inactive}>›</Link> : <span className={dis}>›</span>}
            {currentPage < totalPages ? <Link href={pageHref(totalPages)}       className={inactive}>»</Link> : <span className={dis}>»</span>}
          </div>
        );
      })()}
    </div>
      <PagePopup page="blog" />
    </SidebarLayout>
  );
}
