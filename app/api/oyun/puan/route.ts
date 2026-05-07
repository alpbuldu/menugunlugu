import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const points = Number(body.points);
  if (!points || points < 1 || points > 100) {
    return NextResponse.json({ error: "Geçersiz puan" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("user_points")
    .select("total_points")
    .eq("user_id", user.id)
    .maybeSingle();

  const newTotal = (current?.total_points ?? 0) + points;

  await admin.from("user_points").upsert(
    { user_id: user.id, total_points: newTotal },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ total_points: newTotal });
}
