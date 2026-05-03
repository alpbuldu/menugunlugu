import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function isAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");
  const adminSecret   = process.env.ADMIN_SECRET ?? "";
  return sessionCookie && adminSecret && sessionCookie.value === adminSecret;
}

// POST — admin posts a comment/reply
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { type, resourceId, content, parent_id } = await request.json();

  if (!type || !resourceId || !content?.trim()) {
    return NextResponse.json({ error: "type, resourceId ve content zorunlu." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Admin profilinden username al
  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username")
    .eq("id", 1)
    .single();

  const adminUsername = adminProfile?.username ?? "admin";

  // Profiles tablosundan admin user_id'yi bul
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", adminUsername)
    .single();

  if (!profile) {
    return NextResponse.json({ error: `Admin profili bulunamadı: ${adminUsername}` }, { status: 500 });
  }

  const table = type === "recipe" ? "comments" : "blog_comments";
  const resourceField = type === "recipe" ? "recipe_id" : "post_id";

  const { data, error } = await supabase
    .from(table)
    .insert({
      [resourceField]: resourceId,
      user_id: profile.id,
      content: content.trim(),
      parent_id: parent_id ?? null,
    })
    .select("id, content, created_at, user_id, parent_id, profiles:user_id ( username, avatar_url )")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}

// DELETE — admin deletes any comment
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { commentId, type } = await request.json();

  if (!commentId || !["recipe", "blog"].includes(type)) {
    return NextResponse.json({ error: "commentId ve type (recipe|blog) gerekli." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const table = type === "recipe" ? "comments" : "blog_comments";

  const { error } = await supabase.from(table).delete().eq("id", commentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
