import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Kategori adı gerekli." }, { status: 400 });

  const supabase = createAdminClient();
  const slug = slugify(name.trim());

  // Slug benzersizlik
  const { data: existing } = await supabase
    .from("blog_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({ name: name.trim(), slug: finalSlug })
    .select("id, name, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
