import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_profile")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const { username, avatar_url, full_name, bio, instagram, twitter, youtube, website, comment_user_id } = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_profile")
    .update({ username, avatar_url, full_name, bio, instagram, twitter, youtube, website, comment_user_id: comment_user_id ?? null, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Commenter profili varsa avatar + full_name senkronize et
  const commentUserId = data?.comment_user_id;
  if (commentUserId && avatar_url !== undefined) {
    await supabase
      .from("profiles")
      .update({
        avatar_url: avatar_url ?? null,
        full_name:  full_name  ?? null,
      })
      .eq("id", commentUserId);
  }

  return NextResponse.json(data);
}
