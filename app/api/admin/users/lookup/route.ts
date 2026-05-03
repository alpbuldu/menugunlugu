import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function isAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");
  const adminSecret   = process.env.ADMIN_SECRET ?? "";
  return sessionCookie && adminSecret && sessionCookie.value === adminSecret;
}

// GET /api/admin/users/lookup?username=xxx
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const username = request.nextUrl.searchParams.get("username") ?? "";
  const supabase = createAdminClient();

  // Boş veya kısa sorgu → tüm kullanıcıları listele
  let query = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .order("username", { ascending: true })
    .limit(20);

  if (username.trim().length > 0) {
    query = query.ilike("username", `%${username.trim()}%`);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (data.length === 1) {
    return NextResponse.json(data[0]);
  }

  return NextResponse.json({ results: data });
}
