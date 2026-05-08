import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  // Cookie-based auth (web) veya Bearer token (app)
  const admin = createAdminClient();
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await admin.auth.getUser(token);
    userId = user?.id ?? null;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post_id = req.nextUrl.searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  // Sadece kendi postunu silebilir
  const { data: post } = await admin
    .from("menu_feed_posts")
    .select("id, user_id")
    .eq("id", post_id)
    .maybeSingle();

  if (!post) return NextResponse.json({ error: "Post bulunamadı" }, { status: 404 });
  if (post.user_id !== userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  // Tüm kullanıcıların saved_menus kaydını sil (cascade)
  await Promise.all([
    admin.from("saved_menus").delete().eq("feed_post_id", post_id),
    admin.from("menu_feed_saves").delete().eq("post_id", post_id),
    admin.from("menu_feed_likes").delete().eq("post_id", post_id),
    admin.from("menu_feed_comments").delete().eq("post_id", post_id),
  ]);

  await admin.from("menu_feed_posts").delete().eq("id", post_id);

  return NextResponse.json({ deleted: true });
}
