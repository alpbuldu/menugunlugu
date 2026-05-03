import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET — fetch comments for a recipe
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, parent_id, profiles:user_id ( username, avatar_url )")
    .eq("recipe_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

// POST — add a comment
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const { content, parent_id } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("comments")
    .insert({ recipe_id: id, user_id: user.id, content: content.trim(), parent_id: parent_id ?? null })
    .select("id, content, created_at, user_id, parent_id, profiles:user_id ( username, avatar_url )")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}

// DELETE — delete own comment
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { commentId } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("recipe_id", id)
    .eq("user_id", user.id); // can only delete own comments

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
