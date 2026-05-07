import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Zaten beğendiyse idempotent
  const { data: existing } = await admin
    .from("menu_feed_likes")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("menu_feed_likes").insert({ post_id, user_id: user.id });
    await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 1, p_saves_delta: 0, p_comments_delta: 0 });
  }

  return NextResponse.json({ liked: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("menu_feed_likes")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin.from("menu_feed_likes").delete().eq("id", existing.id);
    await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: -1, p_saves_delta: 0, p_comments_delta: 0 });
  }

  return NextResponse.json({ liked: false });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ liked: false, saved: false });

  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();

  const [likeRes, saveRes] = await Promise.all([
    admin.from("menu_feed_likes").select("id").eq("post_id", post_id).eq("user_id", user.id).maybeSingle(),
    admin.from("menu_feed_saves").select("id").eq("post_id", post_id).eq("user_id", user.id).maybeSingle(),
  ]);

  return NextResponse.json({ liked: !!likeRes.data, saved: !!saveRes.data });
}
