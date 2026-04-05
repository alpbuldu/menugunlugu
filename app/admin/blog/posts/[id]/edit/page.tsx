import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminGetBlogPostById, adminGetAllBlogCategories } from "@/lib/supabase/admin-queries";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const metadata: Metadata = { title: "Blog Yazısı Düzenle" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    adminGetBlogPostById(id),
    adminGetAllBlogCategories(),
  ]);

  if (!post) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
          ← Blog Yönetimi
        </Link>
        <h1 className="text-2xl font-bold text-warm-900 mt-2">Yazıyı Düzenle</h1>
        <p className="text-sm text-warm-400 mt-1">{post.title}</p>
      </div>
      <BlogPostForm categories={categories} post={post} />
    </div>
  );
}
