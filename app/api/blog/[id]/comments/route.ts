import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

async function attachProfiles(admin: ReturnType<typeof createAdminClient>, comments: any[]) {
  if (!comments.length) return comments;
  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  const map: Record<string, { username: string; avatar_url: string | null }> = {};
  (profiles ?? []).forEach((p) => { map[p.id] = { username: p.username, avatar_url: p.avatar_url ?? null }; });
  return comments.map((c) => ({ ...c, profiles: map[c.user_id] ?? null }));
}

// GET — fetch comments for a blog post
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("blog_comments")
    .select("id, content, created_at, user_id, parent_id")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const comments = await attachProfiles(admin, data ?? []);
  return NextResponse.json({ comments });
}

// POST — add a comment
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const { content, parent_id } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_comments")
    .insert({ post_id: id, user_id: user.id, content: content.trim(), parent_id: parent_id ?? null })
    .select("id, content, created_at, user_id, parent_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profile } = await admin
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    comment: { ...data, profiles: profile ?? null },
  }, { status: 201 });
}

// DELETE — delete own comment
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { commentId } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("blog_comments")
    .delete()
    .eq("id", commentId)
    .eq("post_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
