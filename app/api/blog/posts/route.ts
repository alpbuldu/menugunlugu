import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, image_url, category_id, created_at, category:category_id(id, name, slug, created_at)")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug: rawSlug, excerpt, content, image_url, category_id, published } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Başlık ve içerik zorunlu" }, { status: 400 });
    }

    const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(title.trim());
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title:       title.trim(),
        slug,
        excerpt:     excerpt?.trim() || null,
        content:     content.trim(),
        image_url:   image_url ?? null,
        category_id: category_id || null,
        published:   published ?? true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
