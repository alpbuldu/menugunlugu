import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET — is this blog post favorited by current user?
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorited: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_favorites")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ favorited: !!data });
}

// POST — toggle favorite
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("blog_favorites")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin.from("blog_favorites").delete().eq("post_id", id).eq("user_id", user.id);
    return NextResponse.json({ favorited: false });
  } else {
    await admin.from("blog_favorites").insert({ post_id: id, user_id: user.id });
    return NextResponse.json({ favorited: true });
  }
}
