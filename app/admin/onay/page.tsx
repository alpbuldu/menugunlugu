import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import RecipeApprovalCard from "./RecipeApprovalCard";
import PostApprovalCard from "./PostApprovalCard";

export const metadata: Metadata = { title: "İçerik Onayı" };
export const dynamic = "force-dynamic";

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

  const [{ data: recipeData }, { data: postData }, { data: categoryData }] = await Promise.all([
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

    supabase
      .from("blog_categories")
      .select("id, name, slug")
      .order("name"),
  ]);

  const recipes        = (recipeData   ?? []) as unknown as PendingRecipe[];
  const blogCategories = (categoryData ?? []) as unknown as { id: string; name: string; slug: string }[];
  const posts          = (postData     ?? []) as unknown as PendingPost[];
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
                  <RecipeApprovalCard key={recipe.id} recipe={recipe} />
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
                  <PostApprovalCard key={post.id} post={post} categories={blogCategories} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
