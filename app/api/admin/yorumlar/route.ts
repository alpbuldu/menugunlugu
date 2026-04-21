import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// DELETE — admin deletes any comment
export async function DELETE(request: NextRequest) {
  const { id, type } = await request.json();

  if (!id || !["recipe", "blog"].includes(type)) {
    return NextResponse.json({ error: "id ve type (recipe|blog) gerekli." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const table = type === "recipe" ? "comments" : "blog_comments";

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
