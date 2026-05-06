import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: pts, error } = await supabase
      .from("user_points")
      .select("user_id, total_points")
      .order("total_points", { ascending: false })
      .limit(10);

    if (error || !pts || pts.length === 0) {
      return NextResponse.json([]);
    }

    const ids = pts.map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    const profMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
    (profiles ?? []).forEach((p: any) => { profMap[p.id] = p; });

    const result = pts.map((p: any) => ({
      user_id:      p.user_id,
      total_points: p.total_points,
      username:     profMap[p.user_id]?.username ?? null,
      avatar_url:   profMap[p.user_id]?.avatar_url ?? null,
    }));

    return NextResponse.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return NextResponse.json([]);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
