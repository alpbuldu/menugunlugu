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

  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username gerekli." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Önce tam eşleşme dene, sonra içeren ara
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .ilike("username", `%${username}%`)
    .limit(10);

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // Tek sonuç varsa direkt döndür, çok sonuç varsa liste olarak döndür
  if (data.length === 1) {
    return NextResponse.json(data[0]);
  }

  return NextResponse.json({ results: data });
}
