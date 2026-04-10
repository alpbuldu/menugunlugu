import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

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

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const body = await request.json();
  const { title, category, ingredients, instructions, image_url, servings, description } = body;

  if (!title || !category || !ingredients || !instructions) {
    return NextResponse.json({ error: "Başlık, kategori, malzemeler ve yapılış zorunludur." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Geçersiz kategori." }, { status: 400 });
  }

  // Slug — make unique if needed
  const adminSupabase = createAdminClient();
  let slug = toSlug(title);
  const { data: existing } = await adminSupabase
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now()}`;

  const { data, error } = await adminSupabase
    .from("recipes")
    .insert({
      title:           title.trim(),
      slug,
      category,
      ingredients,
      instructions,
      image_url:       image_url ?? null,
      servings:        servings ? parseInt(servings) : null,
      description:     description ?? null,
      submitted_by:    user.id,
      approval_status: "pending",
      created_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data }, { status: 201 });
}
