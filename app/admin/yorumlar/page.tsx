import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import AdminCommentCard from "./AdminCommentCard";

export const metadata: Metadata = { title: "Yorumlar" };
export const dynamic = "force-dynamic";

export default async function YorumlarPage() {
  const supabase = createAdminClient();

  const [{ data: recipeCommentsRaw }, { data: blogCommentsRaw }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id, profiles:user_id ( username, avatar_url ), recipes:recipe_id ( title, slug, id )")
      .order("created_at", { ascending: true }),

    supabase
      .from("blog_comments")
      .select("id, content, created_at, user_id, parent_id, post_id")
      .order("created_at", { ascending: true }),
  ]);

  // blog_comments — profil ve post bilgilerini eşleştir
  const blogRaw     = (blogCommentsRaw  ?? []) as any[];
  const blogUserIds = [...new Set(blogRaw.map(c => c.user_id).filter(Boolean))];
  const blogPostIds = [...new Set(blogRaw.map(c => c.post_id).filter(Boolean))];

  const [{ data: blogProfiles }, { data: blogPosts }] = await Promise.all([
    blogUserIds.length
      ? supabase.from("profiles").select("id, username, avatar_url").in("id", blogUserIds)
      : Promise.resolve({ data: [] }),
    blogPostIds.length
      ? supabase.from("blog_posts").select("id, title, slug").in("id", blogPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap: Record<string, any> = {};
  (blogProfiles ?? []).forEach(p => { profileMap[p.id] = p; });
  const postMap: Record<string, any> = {};
  (blogPosts ?? []).forEach(p => { postMap[p.id] = p; });

  const blogComments = blogRaw.map(c => ({
    ...c,
    profiles:   profileMap[c.user_id] ?? null,
    blog_posts: postMap[c.post_id]    ?? null,
  }));

  // ── Yanıtları parent'a ekle ─────────────────────────────────────────────────
  function nestComments(flat: any[]) {
    const map: Record<string, any> = {};
    flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    const roots: any[] = [];
    flat.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id]);
      } else if (!c.parent_id) {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }

  const rc = nestComments((recipeCommentsRaw ?? []) as any[]);
  const bc = nestComments(blogComments);

  // recipe_id eşlemesi (admin yanıt endpoint'i için)
  const recipeIdByCommentId: Record<string, string> = {};
  (recipeCommentsRaw ?? []).forEach((c: any) => {
    if (c.recipes?.id) recipeIdByCommentId[c.id] = c.recipes.id;
  });
  const postIdByCommentId: Record<string, string> = {};
  blogRaw.forEach(c => { if (c.post_id) postIdByCommentId[c.id] = c.post_id; });

  const totalTop = rc.length + bc.length;
  const totalAll = (recipeCommentsRaw ?? []).length + blogRaw.length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Yorumlar</h1>
          <p className="text-warm-500 text-sm mt-1">Tarif ve blog yazısı yorumlarını yönetin</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
          {totalAll} yorum
        </span>
      </div>

      {totalTop === 0 ? (
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
                  {(recipeCommentsRaw ?? []).length}
                </span>
              </h2>
              <div className="space-y-3">
                {rc.map(c => (
                  <AdminCommentCard
                    key={c.id}
                    comment={c}
                    type="recipe"
                    replyEndpoint={`/api/recipes/${recipeIdByCommentId[c.id]}/comments`}
                  />
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
                  {blogRaw.length}
                </span>
              </h2>
              <div className="space-y-3">
                {bc.map(c => (
                  <AdminCommentCard
                    key={c.id}
                    comment={c}
                    type="blog"
                    replyEndpoint={`/api/blog/${postIdByCommentId[c.id]}/comments`}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
