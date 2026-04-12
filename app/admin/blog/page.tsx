import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { adminGetAllBlogCategories, adminGetAllBlogPosts } from "@/lib/supabase/admin-queries";
import { createAdminClient } from "@/lib/supabase/server";
import BlogCategoryForm from "@/components/admin/BlogCategoryForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata: Metadata = { title: "Blog Yönetimi" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const supabase = createAdminClient();

  const [categories, posts, { data: memberPostsRaw }] = await Promise.all([
    adminGetAllBlogCategories(),
    adminGetAllBlogPosts(),
    supabase
      .from("member_posts")
      .select("id, title, slug, excerpt, image_url, created_at, submitted_by, category_id, approval_status, blog_categories:category_id(name)")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  // Üye profilleri
  const memberIds = [...new Set((memberPostsRaw ?? []).map((p: any) => p.submitted_by).filter(Boolean))];
  const profileMap: Record<string, string> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase
      .from("profiles").select("id, username").in("id", memberIds);
    profiles?.forEach((p) => { profileMap[p.id] = p.username; });
  }

  const memberPosts = (memberPostsRaw ?? []).map((p: any) => ({
    ...p,
    authorUsername: profileMap[p.submitted_by] ?? "?",
    categoryName: p.blog_categories?.name ?? null,
  }));

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

      {/* ── Kategoriler ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-warm-800 mb-4">Kategoriler</h2>
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
          <BlogCategoryForm categories={categories} />
        </div>
      </section>

      {/* ── Admin Yazıları ──────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-warm-800 mb-4">
          Admin Yazıları
          <span className="ml-2 text-sm font-normal text-warm-400">({posts.length})</span>
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 text-center">
            <p className="text-warm-400 text-sm mb-4">Henüz blog yazısı yok.</p>
            <Link href="/admin/blog/posts/new" className="text-brand-600 text-sm font-medium hover:underline">
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
                      <Link href={`/blog/${post.slug}`} target="_blank"
                        className="hover:text-brand-600 transition-colors">
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
                        <Link href={`/admin/blog/posts/${post.id}/edit`}
                          className="text-xs text-brand-600 hover:underline">Düzenle</Link>
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

      {/* ── Üye Yazıları ────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-warm-800 mb-4">
          Üye Yazıları
          <span className="ml-2 text-sm font-normal text-warm-400">({memberPosts.length} onaylı)</span>
        </h2>

        {memberPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 text-center">
            <p className="text-warm-400 text-sm">Henüz onaylanmış üye yazısı yok.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-warm-100 bg-warm-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-warm-600">Başlık</th>
                  <th className="text-left px-5 py-3 font-medium text-warm-600 hidden sm:table-cell">Yazar</th>
                  <th className="text-left px-5 py-3 font-medium text-warm-600 hidden sm:table-cell">Kategori</th>
                  <th className="text-left px-5 py-3 font-medium text-warm-600 hidden md:table-cell">Tarih</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-50">
                {memberPosts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-warm-800">
                      <Link href={`/yazi/${post.slug}`} target="_blank"
                        className="hover:text-brand-600 transition-colors">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <Link href={`/uye/${post.authorUsername}`} target="_blank"
                        className="text-xs text-brand-600 hover:underline">
                        @{post.authorUsername}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-warm-400 hidden sm:table-cell">
                      {post.categoryName ?? <span className="italic text-warm-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-warm-400 hidden md:table-cell">
                      {new Date(post.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/yazi/${post.slug}`} target="_blank"
                          className="text-xs text-brand-600 hover:underline">Görüntüle</Link>
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
