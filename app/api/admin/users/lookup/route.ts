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
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .ilike("username", username)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(data);
}
