import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const BASE = "https://www.menugunlugu.com";

export const revalidate = 3600; // 1 saatte bir güncelle

/** Supabase tarihleri bazen mikrosaniye içerir, Google W3C datetime ister */
function toW3CDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  try {
    return new Date(dateStr).toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [recipesRes, blogRes, memberPostsRes] = await Promise.all([
    supabase.from("recipes").select("slug, updated_at").eq("published", true),
    supabase.from("blog_posts").select("slug, created_at").eq("published", true),
    supabase.from("member_posts").select("slug, created_at").eq("status", "published"),
  ]);

  const recipes = (recipesRes.data ?? []).map((r) => ({
    url: `${BASE}/tarifler/${r.slug}`,
    lastModified: toW3CDate(r.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPosts = (blogRes.data ?? []).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: toW3CDate(p.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const memberPosts = (memberPostsRes.data ?? []).map((p) => ({
    url: `${BASE}/yazi/${p.slug}`,
    lastModified: toW3CDate(p.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const now = new Date().toISOString();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/gunun-menusu`, lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/dunun-menusu`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/blog`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/tarifler`,     lastModified: now, changeFrequency: "daily",   priority: 0.9 },
  ];

  return [...staticPages, ...recipes, ...blogPosts, ...memberPosts];
}
