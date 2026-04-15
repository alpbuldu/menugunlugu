import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGetAllBlogCategories } from "@/lib/supabase/admin-queries";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const metadata: Metadata = { title: "Üye Yazısı Düzenle" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMemberPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: post }, categories] = await Promise.all([
    supabase
      .from("member_posts")
      .select("id, title, slug, excerpt, content, image_url, category_id, created_at")
      .eq("id", id)
      .single(),
    adminGetAllBlogCategories(),
  ]);

  if (!post) notFound();

  // BlogPostForm expects a BlogPost-shaped object
  const postForForm = {
    id:          post.id,
    title:       post.title,
    slug:        post.slug,
    excerpt:     post.excerpt ?? "",
    content:     post.content ?? "",
    image_url:   post.image_url ?? "",
    category_id: post.category_id ?? "",
    created_at:  post.created_at,
    published:   true,
    seo_title:   "",
    seo_keywords: "",
  } as any;

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
          ← Blog Yönetimi
        </Link>
        <h1 className="text-2xl font-bold text-warm-900 mt-2">Üye Yazısı Düzenle</h1>
        <p className="text-sm text-warm-400 mt-1">{post.title}</p>
      </div>
      <BlogPostForm
        categories={categories}
        post={postForForm}
        apiEndpoint={`/api/admin/member-posts/${post.id}`}
      />
    </div>
  );
}
