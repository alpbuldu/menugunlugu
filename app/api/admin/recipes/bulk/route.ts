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

// POST — toplu ekle
export async function POST(request: NextRequest) {
  try {
    const { recipes } = await request.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "Tarif listesi boş" }, { status: 400 });
    }

    const rows = recipes
      .filter((r: { title?: string; ingredients?: string; instructions?: string; category?: Category }) =>
        r.title?.trim() &&
        r.ingredients?.trim() &&
        r.instructions?.trim() &&
        r.category && VALID_CATEGORIES.includes(r.category)
      )
      .map((r: { title: string; ingredients: string; instructions: string; category: Category }) => ({
        title:        r.title.trim(),
        slug:         toSlug(r.title.trim()),
        category:     r.category,
        ingredients:  r.ingredients.trim(),
        instructions: r.instructions.trim(),
        image_url:    null,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Geçerli tarif bulunamadı" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Mevcut başlık ve slug'ları çek — duplicate'leri atla
    const slugs  = rows.map((r) => r.slug);
    const titles = rows.map((r) => r.title.toLowerCase());

    const { data: existing } = await supabase
      .from("recipes")
      .select("slug, title")
      .or(`slug.in.(${slugs.map(s => `"${s}"`).join(",")}),title.in.(${titles.map(t => `"${t}"`).join(",")})`);

    const existingSlugs  = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
    const existingTitles = new Set((existing ?? []).map((r: { title: string }) => r.title.toLowerCase()));

    const newRows  = rows.filter((r) => !existingSlugs.has(r.slug) && !existingTitles.has(r.title.toLowerCase()));
    const skipped  = rows.length - newRows.length;

    if (newRows.length === 0) {
      return NextResponse.json({ imported: 0, skipped });
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert(newRows)
      .select("id, title");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: data?.length ?? newRows.length, skipped });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — toplu sil
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ID listesi boş" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("recipes")
      .delete()
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
