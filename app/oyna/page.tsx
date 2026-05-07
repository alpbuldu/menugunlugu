import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import OynaClient from "./OynaClient";

export const metadata: Metadata = {
  title: "Oyna | Menü Günlüğü",
  description: "Yemek oyunları oyna, puan kazan, liderlik tablosuna gir!",
};

export const dynamic = "force-dynamic";

export interface LeaderEntry {
  user_id: string;
  total_points: number;
  username: string | null;
  avatar_url: string | null;
}

export default async function OynaPage() {
  const supabase = createAdminClient();

  const { data: pts } = await supabase
    .from("user_points")
    .select("user_id, total_points")
    .order("total_points", { ascending: false })
    .limit(10);

  let leaderboard: LeaderEntry[] = [];

  if (pts && pts.length > 0) {
    const ids = (pts as any[]).map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);
    const pm: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { pm[p.id] = p; });
    leaderboard = (pts as any[]).map((p) => ({
      user_id:      p.user_id,
      total_points: p.total_points,
      username:     pm[p.user_id]?.username ?? null,
      avatar_url:   pm[p.user_id]?.avatar_url ?? null,
    }));
  }

  return <OynaClient leaderboard={leaderboard} />;
}
