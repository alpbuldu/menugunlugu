import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body   = await request.json();
  const { date, soup_id, main_id, side_id, dessert_id, status } = body;

  if (!date || !soup_id || !main_id || !side_id || !dessert_id) {
    return NextResponse.json(
      { error: "date, soup_id, main_id, side_id, dessert_id are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }

  if (status && !["draft", "published"].includes(status)) {
    return NextResponse.json({ error: "status must be draft or published" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("menus")
    .update({ date, soup_id, main_id, side_id, dessert_id, status: status ?? "draft" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PUT /api/menu/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ menu: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("menus").delete().eq("id", id);

  if (error) {
    console.error("[DELETE /api/menu/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
