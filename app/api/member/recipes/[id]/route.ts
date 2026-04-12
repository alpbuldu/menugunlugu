import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  // Tarif sahibi mi?
  const { data: existing } = await supabase
    .from("recipes")
    .select("submitted_by")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Tarif bulunamadı." }, { status: 404 });
  if (existing.submitted_by !== user.id)
    return NextResponse.json({ error: "Bu tarifi düzenleme yetkiniz yok." }, { status: 403 });

  const { title, category, servings, description, ingredients, instructions, image_url } = await request.json();

  if (!title?.trim())        return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
  if (!ingredients?.trim())  return NextResponse.json({ error: "Malzemeler gerekli." }, { status: 400 });
  if (!instructions?.trim()) return NextResponse.json({ error: "Yapılış gerekli." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("recipes").update({
    title:           title.trim(),
    category,
    servings:        servings ? parseInt(servings) : null,
    description:     description?.trim() || null,
    ingredients,
    instructions,
    image_url:       image_url || null,
    approval_status: "pending", // tekrar onaya gönder
    updated_at:      new Date().toISOString(),
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
