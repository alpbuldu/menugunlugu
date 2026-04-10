import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// GET — average rating + user's own rating
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const adminSupabase = createAdminClient();

  // Average & count
  const { data: stats } = await adminSupabase
    .from("ratings")
    .select("score")
    .eq("recipe_id", id);

  const scores = (stats ?? []).map((r) => r.score);
  const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const count  = scores.length;

  // User's own rating (if logged in)
  let userScore: number | null = null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await adminSupabase
      .from("ratings")
      .select("score")
      .eq("recipe_id", id)
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

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("ratings")
    .upsert({ recipe_id: id, user_id: user.id, score }, { onConflict: "recipe_id,user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
