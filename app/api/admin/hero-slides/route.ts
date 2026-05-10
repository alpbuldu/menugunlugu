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
    .from("hero_slides")
    .select("*")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { badge, title, subtitle, cta_label, cta_href, image_url, tint, gradient, sort_order } = body;
  if (!badge || !cta_label || !gradient) {
    return NextResponse.json({ error: "badge, cta_label ve gradient zorunludur" }, { status: 400 });
  }
  const supabase = getAdmin();

  // Default sort_order: put at end
  let order = sort_order;
  if (order == null) {
    const { data: last } = await supabase
      .from("hero_slides")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (last?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("hero_slides")
    .insert({ badge, title, subtitle, cta_label, cta_href, image_url, tint, gradient, sort_order: order, is_active: true })
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
    .from("hero_slides")
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
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
