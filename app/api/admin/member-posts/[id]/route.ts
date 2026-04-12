import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteStorageFile } from "@/lib/supabase/storage";

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("member_posts")
    .select("image_url")
    .eq("id", id)
    .single();

  if (!post) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });

  await deleteStorageFile(post.image_url);

  const { error } = await supabase.from("member_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
