import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

const VALID_CATEGORIES: Category[] = ["soup", "main", "side", "dessert"];

export async function POST(request: NextRequest) {
  try {
    const { recipes, category } = await request.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "Tarif listesi boş" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
    }

    const rows = recipes
      .filter((r: { title?: string; ingredients?: string; instructions?: string }) =>
        r.title?.trim() && r.ingredients?.trim() && r.instructions?.trim()
      )
      .map((r: { title: string; ingredients: string; instructions: string }) => ({
        title:        r.title.trim(),
        slug:         toSlug(r.title.trim()),
        category,
        ingredients:  r.ingredients.trim(),
        instructions: r.instructions.trim(),
        image_url:    null,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Geçerli tarif bulunamadı" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recipes")
      .upsert(rows, { onConflict: "slug", ignoreDuplicates: true })
      .select("id, title");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      imported: data?.length ?? rows.length,
      total:    rows.length,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
