import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET — average rating + user's own rating
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: stats } = await admin
    .from("blog_ratings")
    .select("score")
    .eq("post_id", id);

  const scores = (stats ?? []).map((r: { score: number }) => r.score);
  const avg    = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const count  = scores.length;

  let userScore: number | null = null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await admin
      .from("blog_ratings")
      .select("score")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userScore = data?.score ?? null;
  }

  return NextResponse.json({ avg: Math.round(avg * 10) / 10, count, userScore });
}

// POST — upsert rating
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const { score } = await request.json();
  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: "Puan 1-5 arasında olmalı." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("blog_ratings")
    .upsert({ post_id: id, user_id: user.id, score }, { onConflict: "post_id,user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
