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

  if (post.submitted_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name")
      .eq("id", post.submitted_by)
      .maybeSingle();
    if (profile) {
      authorName     = profile.full_name || profile.username;
      authorAvatar   = profile.avatar_url ?? "";
      authorUsername = profile.username;
      authorFullName = profile.full_name ?? "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Geri */}
      <Link href="/"
        className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 transition-colors mb-6">
        ← Ana sayfaya dön
      </Link>

      <article className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        {/* Kapak görseli */}
        {post.image_url && (
          <div className="relative h-60 bg-warm-100">
            <Image src={post.image_url} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        <div className="p-8">
          {/* Başlık */}
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 leading-snug mb-3">
            {post.title}
          </h1>

          {/* Özet */}
          {post.excerpt && (
            <p className="text-warm-500 text-base leading-relaxed mb-4 border-l-4 border-brand-200 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* Yazar + tarih */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-warm-100">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm flex-shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {authorUsername ? (
                <Link href={`/uye/${authorUsername}`}
                  className="text-sm font-semibold text-warm-800 hover:text-brand-700 transition-colors">
                  {authorFullName || authorName}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-warm-800">{authorName}</p>
              )}
              <p className="text-xs text-warm-400">
                {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* İçerik */}
          {post.content.trim().startsWith("<") ? (
            <div
              className="prose prose-warm max-w-none text-warm-700 text-[15px] leading-relaxed tiptap-render"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="prose prose-warm max-w-none text-warm-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}
        </div>
      </article>

      {/* Yazar kartı */}
      {authorUsername && (
        <Link href={`/uye/${authorUsername}`}
          className="mt-4 flex items-center gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-5 hover:border-brand-200 hover:shadow-md transition-all group">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-4 ring-warm-100" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600 text-xl flex-shrink-0 ring-4 ring-warm-100">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-warm-400 mb-0.5">Bu yazının sahibi</p>
            <p className="font-bold text-warm-900 group-hover:text-brand-700 transition-colors">
              {authorFullName || authorName}
            </p>
            {authorFullName && <p className="text-xs text-warm-400">@{authorUsername}</p>}
          </div>
          <span className="text-warm-300 group-hover:text-brand-400 transition-colors text-lg flex-shrink-0">→</span>
        </Link>
      )}
    </div>
  );
}
