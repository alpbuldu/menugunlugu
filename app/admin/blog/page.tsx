import Link from "next/link";
import type { Metadata } from "next";
import { adminGetAllBlogCategories, adminGetAllBlogPosts } from "@/lib/supabase/admin-queries";
import BlogCategoryForm from "@/components/admin/BlogCategoryForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata: Metadata = { title: "Blog Yönetimi" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const [categories, posts] = await Promise.all([
    adminGetAllBlogCategories(),
    adminGetAllBlogPosts(),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">Blog Yönetimi</h1>
        <Link
          href="/admin/blog/posts/new"
          className="px-5 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Yeni Yazı
        </Link>
      </div>

      {/* ── Categories ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-warm-800 mb-4">Kategoriler</h2>
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
          <BlogCategoryForm categories={categories} />
        </div>
      </section>

      {/* ── Posts ──────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-warm-800 mb-4">
          Yazılar
          <span className="ml-2 text-sm font-normal text-warm-400">({posts.length})</span>
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 text-center">
            <p className="text-warm-400 text-sm mb-4">Henüz blog yazısı yok.</p>
            <Link
              href="/admin/blog/posts/new"
              className="text-brand-600 text-sm font-medium hover:underline"
            >
              İlk yazıyı oluştur →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-warm-100 bg-warm-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-warm-600">Başlık</th>
                  <th className="text-left px-5 py-3 font-medium text-warm-600 hidden sm:table-cell">Kategori</th>
                  <th className="text-left px-5 py-3 font-medium text-warm-600 hidden md:table-cell">Tarih</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-50">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-warm-800">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="hover:text-brand-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-warm-400 hidden sm:table-cell">
                      {post.category?.name ?? <span className="italic text-warm-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-warm-400 hidden md:table-cell">
                      {new Date(post.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/blog/posts/${post.id}/edit`}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Düzenle
                        </Link>
                        <DeleteButton
                          endpoint={`/api/blog/posts/${post.id}`}
                          label={`"${post.title}" silinecek. Emin misiniz?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
