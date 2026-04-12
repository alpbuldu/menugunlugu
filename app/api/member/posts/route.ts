import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { title, content, excerpt, image_url } = await request.json();

  if (!title?.trim())   return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: "İçerik gerekli." }, { status: 400 });

  // Generate unique slug
  let baseSlug = slugify(title.trim());
  if (!baseSlug) baseSlug = "yazi";
  let slug = baseSlug;

  const admin = createAdminClient();

  // Check slug uniqueness
  const { data: existing } = await admin
    .from("member_posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${baseSlug}-${Date.now()}`;
  }

  const { error } = await admin.from("member_posts").insert({
    title:        title.trim(),
    slug,
    content,
    excerpt:      excerpt?.trim() || null,
    image_url:    image_url || null,
    submitted_by: user.id,
    approval_status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
