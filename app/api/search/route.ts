import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RECIPE_FIELDS = "id, title, slug, category, submitted_by";
const BLOG_FIELDS   = "id, title, slug, image_url";

export async function GET() {
  const supabase = createAdminClient();

  const [recipesRes, blogRes, apRes, memberPostsRes] = await Promise.all([
    supabase.from("recipes").select(RECIPE_FIELDS)
      .or("approval_status.eq.approved,approval_status.is.null"),
    supabase.from("blog_posts").select(BLOG_FIELDS).eq("published", true),
    supabase.from("admin_profile").select("username, avatar_url").single(),
    supabase.from("member_posts").select("submitted_by").eq("approval_status", "approved"),
  ]);

  const recipesRaw = recipesRes.data ?? [];
  const ap         = apRes.data;
  const adminName  = ap?.username ?? "Menü Günlüğü";

  // Üye profilleri
  const memberIds = [...new Set(recipesRaw.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const approvedPostAuthorIds = new Set(
    (memberPostsRes.data ?? []).map((p) => p.submitted_by).filter(Boolean) as string[]
  );
  const eligibleIds = [...new Set([...memberIds, ...approvedPostAuthorIds])];

  const [profilesRes] = await Promise.all([
    eligibleIds.length > 0
      ? supabase.from("profiles").select("id, username, avatar_url, full_name").in("id", eligibleIds).order("username")
      : { data: [] },
  ]);

  const profileMap: Record<string, string> = {};
  for (const p of profilesRes.data ?? []) profileMap[p.id] = p.username;

  // Tarifler
  const recipes = recipesRaw.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category,
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName,
  }));

  // Blog yazıları
  const blogPosts = (blogRes.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    image_url: p.image_url,
  }));

  // Yazarlar: admin + üyeler
  const authors: { username: string; displayName: string; avatar: string | null; isAdmin: boolean }[] = [];
  if (ap?.username) {
    authors.push({ username: ap.username, displayName: ap.username, avatar: ap.avatar_url ?? null, isAdmin: true });
  }
  for (const p of profilesRes.data ?? []) {
    authors.push({
      username: p.username,
      displayName: p.full_name || p.username,
      avatar: p.avatar_url ?? null,
      isAdmin: false,
    });
  }

  return NextResponse.json({ recipes, blogPosts, authors });
}
