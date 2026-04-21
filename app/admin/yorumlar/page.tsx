import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import CommentDeleteButton from "./CommentDeleteButton";

export const metadata: Metadata = { title: "Yorumlar" };
export const dynamic = "force-dynamic";

export default async function YorumlarPage() {
  const supabase = createAdminClient();

  const [{ data: recipeComments }, { data: blogCommentsRaw }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, user_id, profiles:user_id ( username, avatar_url ), recipes:recipe_id ( title, slug )")
      .order("created_at", { ascending: false }),

    supabase
      .from("blog_comments")
      .select("id, content, created_at, user_id, post_id")
      .order("created_at", { ascending: false }),
  ]);

  // blog_comments has no FK to profiles — fetch manually
  const blogRaw = (blogCommentsRaw ?? []) as any[];
  const blogUserIds = [...new Set(blogRaw.map((c) => c.user_id).filter(Boolean))];
  const blogPostIds = [...new Set(blogRaw.map((c) => c.post_id).filter(Boolean))];

  const [{ data: blogProfiles }, { data: blogPosts }] = await Promise.all([
    blogUserIds.length
      ? supabase.from("profiles").select("id, username, avatar_url").in("id", blogUserIds)
      : Promise.resolve({ data: [] }),
    blogPostIds.length
      ? supabase.from("blog_posts").select("id, title, slug").in("id", blogPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap: Record<string, any> = {};
  (blogProfiles ?? []).forEach((p) => { profileMap[p.id] = p; });
  const postMap: Record<string, any> = {};
  (blogPosts ?? []).forEach((p) => { postMap[p.id] = p; });

  const blogComments = blogRaw.map((c) => ({
    ...c,
    profiles:   profileMap[c.user_id] ?? null,
    blog_posts: postMap[c.post_id]    ?? null,
  }));

  const rc = (recipeComments ?? []) as any[];
  const bc = (blogComments   ?? []) as any[];
  const total = rc.length + bc.length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Yorumlar</h1>
          <p className="text-warm-500 text-sm mt-1">Tarif ve blog yazısı yorumlarını yönetin</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
          {total} yorum
        </span>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center text-warm-400">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-medium">Henüz yorum yok</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Tarif Yorumları ── */}
          {rc.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-4">
                Tarif Yorumları
                <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium normal-case">
                  {rc.length}
                </span>
              </h2>
              <div className="space-y-3">
                {rc.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Yazar + tarih */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-warm-800">
                            {c.profiles?.username ?? "Silinmiş kullanıcı"}
                          </span>
                          <span className="text-xs text-warm-400">
                            {new Date(c.created_at).toLocaleDateString("tr-TR", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          {c.recipes && (
                            <a
                              href={`/tarifler/${c.recipes.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:underline truncate max-w-[200px]"
                            >
                              🍽️ {c.recipes.title}
                            </a>
                          )}
                        </div>
                        {/* Yorum metni */}
                        <p className="text-sm text-warm-700 leading-relaxed">{c.content}</p>
                      </div>
                      <CommentDeleteButton commentId={c.id} type="recipe" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Blog Yorumları ── */}
          {bc.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-4">
                Blog Yorumları
                <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium normal-case">
                  {bc.length}
                </span>
              </h2>
              <div className="space-y-3">
                {bc.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-warm-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Yazar + tarih */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-warm-800">
                            {c.profiles?.username ?? "Silinmiş kullanıcı"}
                          </span>
                          <span className="text-xs text-warm-400">
                            {new Date(c.created_at).toLocaleDateString("tr-TR", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          {c.blog_posts && (
                            <a
                              href={`/blog/${c.blog_posts.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 hover:underline truncate max-w-[200px]"
                            >
                              ✍️ {c.blog_posts.title}
                            </a>
                          )}
                        </div>
                        {/* Yorum metni */}
                        <p className="text-sm text-warm-700 leading-relaxed">{c.content}</p>
                      </div>
                      <CommentDeleteButton commentId={c.id} type="blog" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
