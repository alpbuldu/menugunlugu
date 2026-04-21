import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ui/ShareButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_posts")
    .select("title, excerpt, image_url, content")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle();
  if (!data) return { title: "Yazı bulunamadı" };
  const description = data.excerpt ?? data.content.replace(/<[^>]+>/g, "").slice(0, 155);
  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      type: "article",
      images: data.image_url ? [{ url: data.image_url, width: 1200, height: 630, alt: data.title }] : [],
    },
  };
}

export default async function YaziDetayPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin    = createAdminClient();

  const { data: post } = await supabase
    .from("member_posts")
    .select("id, title, slug, content, excerpt, image_url, created_at, submitted_by, category_id, blog_categories:category_id(name)")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!post) notFound();

  // Yazar bilgisi
  let authorName      = "Üye";
  let authorAvatar    = "";
  let authorUsername  = "";
  let authorFullName  = "";
  let authorPostCount = 0;

  if (post.submitted_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name")
      .eq("id", post.submitted_by)
      .maybeSingle();
    if (profile) {
      authorName     = profile.username;
      authorAvatar   = profile.avatar_url ?? "";
      authorUsername = profile.username;
      authorFullName = profile.full_name ?? "";
    }
    const { count } = await supabase
      .from("member_posts")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", post.submitted_by)
      .eq("approval_status", "approved");
    authorPostCount = count ?? 0;
  }

  const categoryName = (post.blog_categories as any)?.name ?? null;
  const hasImage = !!post.image_url;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Geri */}
      <Link href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6">
        ← Blog
      </Link>

      {/* Kart */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Hero görsel */}
        <div className="relative h-72 bg-warm-100">
          {hasImage ? (
            <Image src={post.image_url!} alt={post.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          ) : (
            <div className="flex items-center justify-center h-full text-7xl text-warm-300">✍️</div>
          )}
          {/* Yazar overlay */}
          <Link
            href={`/uye/${authorUsername}`}
            className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors rounded-full px-3 py-1.5"
          >
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-brand-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-xs font-medium text-white">{authorName}</span>
          </Link>
        </div>

        <div className="p-8">
          {/* Başlık bölümü */}
          <div className="mb-8">
            {categoryName && (
              <span className="inline-block self-start w-fit mb-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
                {categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 leading-snug">
              {post.title}
            </h1>
            <p className="text-sm text-warm-400 mt-2">
              {new Date(post.created_at).toLocaleDateString("tr-TR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          {/* Özet */}
          {post.excerpt && (
            <p className="text-warm-500 text-base leading-relaxed mb-6 pb-6 border-b border-warm-100 font-medium">
              {post.excerpt}
            </p>
          )}

          {/* İçerik */}
          {post.content.trimStart().startsWith("<") ? (
            <div
              className="prose-content text-warm-700 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="text-warm-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}
        </div>
      </div>

      {/* Yazar kartı */}
      {authorUsername && (
        <Link
          href={`/uye/${authorUsername}?tab=yazilar`}
          className="mt-4 flex items-center gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-4 hover:border-brand-200 hover:shadow-md transition-all group"
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorFullName || authorName}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-warm-100" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-lg font-bold text-brand-600 flex-shrink-0 ring-2 ring-warm-100">
              {(authorFullName || authorName).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-warm-400">Bu yazının sahibi</p>
            <p className="font-semibold text-warm-900 text-sm group-hover:text-brand-700 transition-colors leading-tight">
              {authorFullName || authorName}
            </p>
            {authorFullName && <p className="text-[11px] text-warm-400">@{authorName}</p>}
            <p className="text-[11px] text-warm-400 mt-0.5">{authorPostCount} yazı · Yazıları gör →</p>
          </div>
          <span className="text-warm-300 group-hover:text-brand-400 transition-colors text-base flex-shrink-0">→</span>
        </Link>
      )}

      {/* Alt nav */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors"
        >
          ← Tüm yazılara dön
        </Link>
        <ShareButton title={post.title} />
      </div>
    </div>
  );
}
