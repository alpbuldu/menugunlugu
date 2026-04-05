import Link from "next/link";
import type { Metadata } from "next";
import { adminGetAllBlogCategories } from "@/lib/supabase/admin-queries";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const metadata: Metadata = { title: "Yeni Blog Yazısı" };

export default async function NewBlogPostPage() {
  const categories = await adminGetAllBlogCategories();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
          ← Blog Yönetimi
        </Link>
        <h1 className="text-2xl font-bold text-warm-900 mt-2">Yeni Blog Yazısı</h1>
      </div>
      <BlogPostForm categories={categories} />
    </div>
  );
}
