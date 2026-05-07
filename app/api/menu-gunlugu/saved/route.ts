import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: menus, error } = await supabase
    .from("saved_menus")
    .select("id, created_at, soup_id, main_id, side_id, dessert_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!menus || menus.length === 0) return NextResponse.json([]);

  const ids = [...new Set(
    (menus as any[]).flatMap((m) => [m.soup_id, m.main_id, m.side_id, m.dessert_id].filter(Boolean))
  )];

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, kcal_per_person, image_url, category")
    .in("id", ids);

  const recipeMap: Record<string, any> = {};
  (recipes ?? []).forEach((r: any) => { recipeMap[r.id] = r; });

  const enriched = (menus as any[]).map((m) => ({
    ...m,
    soup:    m.soup_id    ? recipeMap[m.soup_id]    ?? null : null,
    main:    m.main_id    ? recipeMap[m.main_id]    ?? null : null,
    side:    m.side_id    ? recipeMap[m.side_id]    ?? null : null,
    dessert: m.dessert_id ? recipeMap[m.dessert_id] ?? null : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json();
  const { soup_id, main_id, side_id, dessert_id } = body;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_menus")
    .insert({ user_id: user.id, soup_id, main_id, side_id, dessert_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("saved_menus")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
