import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET — pending recipes list
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("recipes")
    .select(`
      id, title, slug, category, image_url, description,
      ingredients, instructions, servings,
      approval_status, created_at,
      submitted_by, profiles:submitted_by ( username, avatar_url )
    `)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipes: data ?? [] });
}

// PATCH — approve or reject a recipe
export async function PATCH(request: NextRequest) {
  const { id, action } = await request.json(); // action: "approve" | "reject"

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id ve action (approve|reject) gerekli." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("recipes")
    .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: newStatus });
}
