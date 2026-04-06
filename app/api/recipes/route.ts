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
  return NextResponse.json({ recipes });
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

  const slug = toSlug(title);
  const supabase = createAdminClient();

  const { servings } = body;

  const { data, error } = await supabase
    .from("recipes")
    .insert({ title, slug, category, ingredients, instructions, image_url: image_url ?? null, servings: servings ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data }, { status: 201 });
}
