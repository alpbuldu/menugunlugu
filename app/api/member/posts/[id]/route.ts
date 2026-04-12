import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { deleteStorageFile } from "@/lib/supabase/storage";

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("member_posts")
    .select("submitted_by")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
  if (existing.submitted_by !== user.id)
    return NextResponse.json({ error: "Bu yazıyı düzenleme yetkiniz yok." }, { status: 403 });

  const { title, excerpt, content, image_url } = await request.json();

  if (!title?.trim())   return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: "İçerik gerekli." }, { status: 400 });

  const { error } = await admin.from("member_posts").update({
    title:           title.trim(),
    excerpt:         excerpt?.trim() || null,
    content:         content.trim(),
    image_url:       image_url || null,
    approval_status: "pending",
    updated_at:      new Date().toISOString(),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("member_posts")
    .select("submitted_by, image_url")
    .eq("id", id)
    .single();

  if (!post) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
  if (post.submitted_by !== user.id)
    return NextResponse.json({ error: "Bu yazıyı silme yetkiniz yok." }, { status: 403 });

  await deleteStorageFile(post.image_url);

  const { error } = await admin.from("member_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
