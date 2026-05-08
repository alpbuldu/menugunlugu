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
    const { data: fp } = await admin
      .from("menu_feed_posts")
      .select("soup_id, soup_title, soup_image_url, main_id, main_title, main_image_url, side_id, side_title, side_image_url, dessert_id, dessert_title, dessert_image_url, title")
      .eq("id", post_id)
      .maybeSingle();

    await admin.from("menu_feed_saves").insert({ post_id, user_id: user.id });

    if (fp) {
      const menuName = (fp as any).title
        || [(fp as any).soup_title, (fp as any).main_title, (fp as any).side_title, (fp as any).dessert_title].filter(Boolean).join(", ");
      await admin.from("saved_menus").insert({
        user_id: user.id,
        name: menuName,
        is_feed_save: true,
        feed_post_id: post_id,
        soup_id:    (fp as any).soup_id,    soup_title:    (fp as any).soup_title,    soup_image_url:    (fp as any).soup_image_url,
        main_id:    (fp as any).main_id,    main_title:    (fp as any).main_title,    main_image_url:    (fp as any).main_image_url,
        side_id:    (fp as any).side_id,    side_title:    (fp as any).side_title,    side_image_url:    (fp as any).side_image_url,
        dessert_id: (fp as any).dessert_id, dessert_title: (fp as any).dessert_title, dessert_image_url: (fp as any).dessert_image_url,
      });
    }

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
    await Promise.all([
      admin.from("menu_feed_saves").delete().eq("id", existing.id),
      admin.from("saved_menus").delete().eq("feed_post_id", post_id).eq("user_id", user.id),
      admin.rpc("rpc_update_feed_counts", { p_post_id: post_id, p_likes_delta: 0, p_saves_delta: -1, p_comments_delta: 0 }),
    ]);
  }

  return NextResponse.json({ saved: false });
}
