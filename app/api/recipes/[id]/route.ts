import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

type Params = Promise<{ id: string }>;

const VALID_CATEGORIES: Category[] = ["soup", "main", "side", "dessert"];

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body   = await request.json();
  const { title, category, description, seo_title, seo_keywords, ingredients, instructions, image_url, servings } = body;

  if (!title || !category || !ingredients || !instructions) {
    return NextResponse.json(
      { error: "title, category, ingredients, instructions are required" },
      { status: 400 }
    );
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("recipes")
    .update({
      title,
      slug: toSlug(title),
      category,
      description:  description ?? null,
      seo_title:    seo_title ?? null,
      seo_keywords: seo_keywords ?? null,
      ingredients,
      instructions,
      image_url: image_url || null,
      servings: servings ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PUT /api/recipes/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Check if this recipe is referenced by any menu before deleting
  const { data: refs } = await supabase
    .from("menus")
    .select("id")
    .or(`soup_id.eq.${id},main_id.eq.${id},side_id.eq.${id},dessert_id.eq.${id}`)
    .limit(1);

  if (refs && refs.length > 0) {
    return NextResponse.json(
      { error: "Bu tarif bir veya daha fazla menüde kullanılıyor. Önce menüyü silin." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/recipes/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
