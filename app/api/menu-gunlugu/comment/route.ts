import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("menu_feed_comments")
    .select("id, created_at, content, user_id")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!data || data.length === 0) return NextResponse.json([]);

  const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const pMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { pMap[p.id] = p; });

  const enriched = data.map((c: any) => ({
    ...c,
    author: pMap[c.user_id] ?? { username: "Kullanıcı", avatar_url: null },
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { post_id, content } = await req.json();
  if (!post_id || !content?.trim()) return NextResponse.json({ error: "post_id and content required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: comment, error } = await admin
    .from("menu_feed_comments")
    .insert({ post_id, user_id: user.id, content: content.trim() })
    .select("id, created_at, content, user_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 0, p_saves_delta: 0, p_comments_delta: 1 });

  const { data: profile } = await admin.from("profiles").select("username, avatar_url").eq("id", user.id).single();

  return NextResponse.json({
    ...comment,
    author: profile ?? { username: "Kullanıcı", avatar_url: null },
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment_id = req.nextUrl.searchParams.get("comment_id");
  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!comment_id || !post_id) return NextResponse.json({ error: "comment_id and post_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("menu_feed_comments")
    .select("id")
    .eq("id", comment_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("menu_feed_comments").delete().eq("id", comment_id);
  await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 0, p_saves_delta: 0, p_comments_delta: -1 });

  return NextResponse.json({ deleted: true });
}
