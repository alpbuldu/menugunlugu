"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import DeleteFeedPostButton from "./DeleteFeedPostButton";

export const metadata: Metadata = { title: "Menü Akışı" };
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function MenuFeedPage() {
  const supabase = createAdminClient();

  const { data: posts } = await supabase
    .from("menu_feed_posts")
    .select(
      "id, user_id, title, created_at, likes_count, saves_count, comments_count, soup_title, main_title, side_title, dessert_title"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = [...new Set((posts ?? []).map((p: any) => p.user_id).filter(Boolean))];
  const profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.username; });
  }

  const rows = (posts ?? []) as any[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Menü Akışı</h1>
          <p className="text-sm text-warm-400 mt-0.5">{rows.length} post</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-warm-600 font-medium">Henüz menü paylaşımı yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Menü Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Yemekler</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">❤️ / 💬 / 🔖</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Tarih</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {rows.map((post: any) => {
                const username = post.user_id ? (profileMap[post.user_id] ?? `(${post.user_id.slice(0, 8)}…)`) : "—";
                return (
                  <tr key={post.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-brand-600 font-medium text-xs">@{username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-warm-800 text-sm">{post.title || "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-warm-500">
                        {post.soup_title    && <span>🍲 {post.soup_title}</span>}
                        {post.main_title    && <span>🍽️ {post.main_title}</span>}
                        {post.side_title    && <span>🥗 {post.side_title}</span>}
                        {post.dessert_title && <span>🍮 {post.dessert_title}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      <span className="text-xs text-warm-500">
                        {post.likes_count ?? 0} / {post.comments_count ?? 0} / {post.saves_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-warm-400">{formatDate(post.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteFeedPostButton postId={post.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
