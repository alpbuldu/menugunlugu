import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const supabase = createAdminClient();

  let query = supabase
    .from("recipes")
    .select("id, title, slug, category, submitted_by")
    .or("approval_status.eq.approved,approval_status.is.null")
    .order("title")
    .limit(12);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Yazar adlarını çek
  const memberIds = [...new Set(
    (data ?? []).filter(r => r.submitted_by).map(r => r.submitted_by as string)
  )];
  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", memberIds);
    for (const p of profiles ?? []) profileMap[p.id] = p.username;
  }
  const { data: ap } = await supabase.from("admin_profile").select("username").single();
  const adminName = ap?.username ?? "Menü Günlüğü";

  const result = (data ?? []).map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category,
    author: r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName,
  }));

  return NextResponse.json(result);
}
