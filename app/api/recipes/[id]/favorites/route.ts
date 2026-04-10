import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET — is favorited by current user?
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ favorited: false });

  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("favorites")
    .select("recipe_id")
    .eq("recipe_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ favorited: !!data });
}

// POST — toggle favorite
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const adminSupabase = createAdminClient();

  // Check if already favorited
  const { data: existing } = await adminSupabase
    .from("favorites")
    .select("recipe_id")
    .eq("recipe_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Remove
    await adminSupabase.from("favorites").delete().eq("recipe_id", id).eq("user_id", user.id);
    return NextResponse.json({ favorited: false });
  } else {
    // Add
    await adminSupabase.from("favorites").insert({ recipe_id: id, user_id: user.id });
    return NextResponse.json({ favorited: true });
  }
}
