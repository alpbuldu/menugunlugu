import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getRecipes } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  // Tarifler
  const recipesRaw = await getRecipes();
  const memberIds = [...new Set(recipesRaw.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];

  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", memberIds);
    for (const p of profiles ?? []) profileMap[p.id] = p.username;
  }

  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").single();
  const adminName = ap?.username ?? "Menü Günlüğü";

  const recipes = recipesRaw.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category,
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName,
  }));

  // Yazarlar: üyeler + admin
  const authors: { username: string; displayName: string; avatar: string | null; isAdmin: boolean }[] = [];

  // Admin
  if (ap?.username) {
    authors.push({ username: ap.username, displayName: ap.username, avatar: ap.avatar_url ?? null, isAdmin: true });
  }

  // Üye profilleri
  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("username, avatar_url, full_name")
    .order("username");

  for (const p of memberProfiles ?? []) {
    authors.push({
      username: p.username,
      displayName: p.full_name || p.username,
      avatar: p.avatar_url ?? null,
      isAdmin: false,
    });
  }

  return NextResponse.json({ recipes, authors });
}
