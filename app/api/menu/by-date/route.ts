import { NextRequest, NextResponse } from "next/server";
import { getMenuByDate } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date param required in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const menu = await getMenuByDate(date);

  if (!menu) {
    return NextResponse.json(
      { error: `No published menu found for ${date}` },
      { status: 404 }
    );
  }

  const supabase = createAdminClient();

  // Fetch admin profile
  const { data: ap } = await supabase
    .from("admin_profile")
    .select("username, avatar_url")
    .eq("id", 1)
    .single();

  const adminProfile = {
    username: ap?.username ?? "Menü Günlüğü",
    avatar_url: ap?.avatar_url ?? null,
  };

  // Fetch member profiles for recipes that have submitted_by
  const memberIds = [menu.soup, menu.main, menu.side, menu.dessert]
    .map((r: any) => r?.submitted_by)
    .filter(Boolean) as string[];
  const uniqueIds = [...new Set(memberIds)];

  const memberProfiles: Record<string, { username: string; avatar_url: string | null }> = {};
  if (uniqueIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", uniqueIds);
    profiles?.forEach((p: any) => {
      memberProfiles[p.id] = { username: p.username, avatar_url: p.avatar_url ?? null };
    });
  }

  return NextResponse.json({ menu, adminProfile, memberProfiles });
}
