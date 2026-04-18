import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, image_url, link_url, placement } = body;
  if (!image_url || !link_url || !placement) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ads")
    .insert({ title, image_url, link_url, placement, is_active: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("ads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const supabase = getAdmin();
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
