import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
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
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle();
  if (!data) return { title: "Yazı bulunamadı" };
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
  };
}

export default async function YaziDetayPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("member_posts")
    .select("id, title, slug, content, excerpt, image_url, created_at, submitted_by")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!post) notFound();

  // Yazar bilgisi
  let authorName     = "Üye";
  let authorAvatar   = "";
  let authorUsername = "";
  let authorFullName = "";
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Geri */}
      <Link href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6">
        ← Bloga dön
      </Link>

      <article className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Kapak görseli + yazar overlay */}
        {post.image_url ? (
          <div className="relative h-64 bg-warm-100">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" priority />
            {/* Yazar overlay — görselin sol altı */}
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
        ) : (
          /* Görsel yoksa yazar üstte küçük satır olarak */
          <div className="px-8 pt-6 pb-0">
            <Link href={`/uye/${authorUsername}`}
              className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-xs font-medium text-warm-500">{authorName}</span>
            </Link>
          </div>
        )}

        <div className="p-8">
          {/* Tarih */}
          <p className="text-xs text-warm-400 mb-3">
            {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Başlık */}
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 leading-snug mb-4">
            {post.title}
          </h1>

          {/* Özet */}
          {post.excerpt && (
            <p className="text-warm-500 text-base leading-relaxed mb-6 border-l-4 border-brand-200 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* İçerik */}
          {post.content.trim().startsWith("<") ? (
            <div
              className="tiptap-render text-warm-700 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="text-warm-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}
        </div>
      </article>

      {/* Yazar kartı */}
      {authorUsername && (
        <Link href={`/uye/${authorUsername}`}
          className="mt-6 flex items-center gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-4 hover:border-brand-200 hover:shadow-md transition-all group">
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
            <p className="text-[11px] text-warm-400 mt-0.5">{authorPostCount} yazı · Tüm yazıları gör →</p>
          </div>
          <span className="text-warm-300 group-hover:text-brand-400 transition-colors text-base flex-shrink-0">→</span>
        </Link>
      )}
    </div>
  );
}
