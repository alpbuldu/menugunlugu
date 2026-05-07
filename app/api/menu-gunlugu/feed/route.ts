import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page  = Math.max(0, parseInt(searchParams.get("page") ?? "0"));
  const limit = 20;

  const supabase = createAdminClient();

  const { data: posts, error } = await supabase
    .from("menu_feed_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts || posts.length === 0) return NextResponse.json([]);

  const userIds = [...new Set((posts as any[]).map((p) => p.user_id).filter(Boolean))];

  const [{ data: profiles }, { data: ap }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
    supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single(),
  ]);

  const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  const enriched = (posts as any[]).map((p) => ({
    ...p,
    author: profileMap[p.user_id] ?? { username: ap?.username ?? "Menü Günlüğü", avatar_url: ap?.avatar_url ?? null },
  }));

  return NextResponse.json(enriched);
}
