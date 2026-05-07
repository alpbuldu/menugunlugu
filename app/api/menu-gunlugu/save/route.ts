import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { post_id } = await req.json();
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("menu_feed_saves")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("menu_feed_saves").insert({ post_id, user_id: user.id });
    await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 0, p_saves_delta: 1, p_comments_delta: 0 });
  }

  return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("menu_feed_saves")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin.from("menu_feed_saves").delete().eq("id", existing.id);
    await admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 0, p_saves_delta: -1, p_comments_delta: 0 });
  }

  return NextResponse.json({ saved: false });
}
