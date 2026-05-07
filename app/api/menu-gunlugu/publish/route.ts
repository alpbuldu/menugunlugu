import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json();
  const { soup_id, main_id, side_id, dessert_id } = body;
  if (!soup_id || !main_id || !side_id || !dessert_id)
    return NextResponse.json({ error: "Tüm yemekler seçilmeli" }, { status: 400 });

  const admin = createAdminClient();

  const { data: recipes } = await admin
    .from("recipes")
    .select("id, title, slug, category")
    .in("id", [soup_id, main_id, side_id, dessert_id]);

  const rm: Record<string, any> = {};
  (recipes ?? []).forEach((r: any) => { rm[r.id] = r; });

  const { data, error } = await admin
    .from("menu_feed_posts")
    .insert({
      user_id:       user.id,
      soup_id,    soup_title:    rm[soup_id]?.title    ?? "",  soup_slug:    rm[soup_id]?.slug    ?? "",
      main_id,    main_title:    rm[main_id]?.title    ?? "",  main_slug:    rm[main_id]?.slug    ?? "",
      side_id,    side_title:    rm[side_id]?.title    ?? "",  side_slug:    rm[side_id]?.slug    ?? "",
      dessert_id, dessert_title: rm[dessert_id]?.title ?? "",  dessert_slug: rm[dessert_id]?.slug ?? "",
      likes_count: 0, saves_count: 0, comments_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
