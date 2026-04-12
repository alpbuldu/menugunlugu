import { createAdminClient } from "@/lib/supabase/server";
import Image from "next/image";
import type { Metadata } from "next";
import ApprovalActions from "./ApprovalActions";

export const metadata: Metadata = { title: "İçerik Onayı" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

function isRevision(created_at: string, updated_at: string | null): boolean {
  if (!updated_at) return false;
  const diff = new Date(updated_at).getTime() - new Date(created_at).getTime();
  return diff > 30_000; // 30 saniyeden fazla fark varsa düzenleme
}

function RevisionBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
      ✏️ Düzenleme
    </span>
  );
}

interface PendingRecipe {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string | null;
  description: string | null;
  ingredients: string;
  instructions: string;
  servings: number | null;
  created_at: string;
  updated_at: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface PendingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
}

export default async function OnayPage() {
  const supabase = createAdminClient();

  const [{ data: recipeData }, { data: postData }] = await Promise.all([
    supabase
      .from("recipes")
      .select(`
        id, title, slug, category, image_url, description,
        ingredients, instructions, servings, created_at, updated_at,
        profiles:submitted_by ( username, avatar_url )
      `)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true }),

    supabase
      .from("member_posts")
      .select(`
        id, title, slug, excerpt, content, image_url, created_at, updated_at,
        profiles:submitted_by ( username, avatar_url )
      `)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const recipes = (recipeData ?? []) as PendingRecipe[];
  const posts   = (postData   ?? []) as PendingPost[];
  const total   = recipes.length + posts.length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">İçerik Onayı</h1>
          <p className="text-warm-500 text-sm mt-1">
            Üyelerden gelen ve inceleme bekleyen tarifler ve yazılar
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
          {total} bekliyor
        </span>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center text-warm-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium">İncelenecek içerik yok</p>
          <p className="text-sm mt-1">Tüm içerikler incelendi.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Tarifler ── */}
          {recipes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-4">
                Tarifler
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium normal-case">{recipes.length}</span>
              </h2>
              <div className="space-y-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
                    <div className="flex gap-4 p-5">
                      {/* Görsel */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
                        {recipe.image_url ? (
                          <Image src={recipe.image_url} alt={recipe.title} width={96} height={96}
                            className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                        )}
                      </div>

                      {/* Bilgiler */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h2 className="font-bold text-warm-900 text-lg leading-snug">{recipe.title}</h2>
                              {isRevision(recipe.created_at, recipe.updated_at) && <RevisionBadge />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                                {CATEGORY_LABELS[recipe.category]}
                              </span>
                              {recipe.servings && (
                                <span className="text-xs text-warm-400">👤 {recipe.servings} kişilik</span>
                              )}
                              <span className="text-xs text-warm-400">
                                {new Date(recipe.created_at).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                          </div>

                          {/* Gönderen */}
                          {recipe.profiles && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
                                {recipe.profiles.avatar_url ? (
                                  <Image src={recipe.profiles.avatar_url} alt={recipe.profiles.username}
                                    width={28} height={28} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs">👤</span>
                                )}
                              </div>
                              <span className="text-sm text-warm-600 font-medium">{recipe.profiles.username}</span>
                            </div>
                          )}
                        </div>

                        {recipe.description && (
                          <p className="text-sm text-warm-500 mt-2 line-clamp-2">{recipe.description}</p>
                        )}
                      </div>
                    </div>

                    {/* İçerik önizleme */}
                    <div className="border-t border-warm-100 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-100">
                      <div className="p-5">
                        <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Malzemeler</h3>
                        {recipe.ingredients.trim().startsWith("<") ? (
                          <div className="recipe-content text-sm text-warm-700 line-clamp-6"
                            dangerouslySetInnerHTML={{ __html: recipe.ingredients }} />
                        ) : (
                          <p className="text-sm text-warm-700 whitespace-pre-line line-clamp-6">
                            {recipe.ingredients}
                          </p>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Yapılışı</h3>
                        {recipe.instructions.trim().startsWith("<") ? (
                          <div className="recipe-content text-sm text-warm-700 line-clamp-6"
                            dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
                        ) : (
                          <p className="text-sm text-warm-700 whitespace-pre-line line-clamp-6">
                            {recipe.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aksiyon */}
                    <div className="border-t border-warm-100 px-5 py-3 bg-warm-50 flex items-center justify-end gap-3">
                      <ApprovalActions itemId={recipe.id} type="recipe" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Yazılar ── */}
          {posts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warm-500 uppercase tracking-wide mb-4">
                Blog Yazıları
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium normal-case">{posts.length}</span>
              </h2>
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
                    <div className="flex gap-4 p-5">
                      {/* Görsel */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
                        {post.image_url ? (
                          <Image src={post.image_url} alt={post.title} width={96} height={96}
                            className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">✍️</div>
                        )}
                      </div>

                      {/* Bilgiler */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h2 className="font-bold text-warm-900 text-lg leading-snug">{post.title}</h2>
                              {isRevision(post.created_at, post.updated_at) && <RevisionBadge />}
                            </div>
                            <span className="text-xs text-warm-400">
                              {new Date(post.created_at).toLocaleDateString("tr-TR")}
                            </span>
                          </div>

                          {/* Gönderen */}
                          {post.profiles && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
                                {post.profiles.avatar_url ? (
                                  <Image src={post.profiles.avatar_url} alt={post.profiles.username}
                                    width={28} height={28} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs">👤</span>
                                )}
                              </div>
                              <span className="text-sm text-warm-600 font-medium">{post.profiles.username}</span>
                            </div>
                          )}
                        </div>

                        {post.excerpt && (
                          <p className="text-sm text-warm-500 mt-2 line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                    </div>

                    {/* İçerik önizleme */}
                    <div className="border-t border-warm-100 p-5">
                      <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">İçerik</h3>
                      <p className="text-sm text-warm-700 whitespace-pre-line line-clamp-6">
                        {post.content}
                      </p>
                    </div>

                    {/* Aksiyon */}
                    <div className="border-t border-warm-100 px-5 py-3 bg-warm-50 flex items-center justify-end gap-3">
                      <ApprovalActions itemId={post.id} type="post" />
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
