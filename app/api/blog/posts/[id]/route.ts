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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, image_url, category_id, created_at, category:category_id(id, name, slug, created_at)")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug: rawSlug, excerpt, content, image_url, category_id, published, seo_title, seo_keywords } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Başlık ve içerik zorunlu" }, { status: 400 });
    }

    const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(title.trim());
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title:        title.trim(),
        slug,
        excerpt:      excerpt?.trim() || null,
        content:      content.trim(),
        image_url:    image_url ?? null,
        category_id:  category_id || null,
        published:    published ?? true,
        seo_title:    seo_title?.trim() || null,
        seo_keywords: seo_keywords?.trim() || null,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
