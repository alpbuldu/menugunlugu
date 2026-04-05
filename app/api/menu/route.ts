import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, soup_id, main_id, side_id, dessert_id, status = "draft" } = body;

  if (!date || !soup_id || !main_id || !side_id || !dessert_id) {
    return NextResponse.json(
      { error: "date, soup_id, main_id, side_id, dessert_id are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  if (!["draft", "published"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'draft' or 'published'" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("menus")
    .upsert(
      { date, soup_id, main_id, side_id, dessert_id, status },
      { onConflict: "date,status" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ menu: data }, { status: 201 });
}
