import { NextRequest, NextResponse } from "next/server";
import { getRecipes } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

const VALID_CATEGORIES: Category[] = ["soup", "main", "side", "dessert"];

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");

  const category =
    categoryParam && VALID_CATEGORIES.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : undefined;

  const recipes = await getRecipes(category);

  // Yazar adlarını ekle
  const supabase = createAdminClient();
  const memberIds = [...new Set(recipes.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", memberIds);
    for (const p of profiles ?? []) profileMap[p.id] = p.username;
  }
  const { data: ap } = await supabase.from("admin_profile").select("username").single();
  const adminName = ap?.username ?? "Menü Günlüğü";

  const recipesWithAuthor = recipes.map((r) => ({
    ...r,
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName,
  }));

  return NextResponse.json({ recipes: recipesWithAuthor });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, category, ingredients, instructions, image_url } = body;

  if (!title || !category || !ingredients || !instructions) {
    return NextResponse.json(
      { error: "title, category, ingredients, instructions are required" },
      { status: 400 }
    );
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let slug = toSlug(title);
  const { data: existingSlugs } = await supabase
    .from("recipes")
    .select("slug")
    .like("slug", `${slug}%`);
  if (existingSlugs && existingSlugs.some((r: { slug: string }) => r.slug === slug)) {
    const taken = new Set(existingSlugs.map((r: { slug: string }) => r.slug));
    let n = 2;
    while (taken.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }

  const { servings, description, seo_title, seo_keywords } = body;

  const { data, error } = await supabase
    .from("recipes")
    .insert({ title, slug, category, description: description ?? null, seo_title: seo_title ?? null, seo_keywords: seo_keywords ?? null, ingredients, instructions, image_url: image_url ?? null, servings: servings ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data }, { status: 201 });
}
