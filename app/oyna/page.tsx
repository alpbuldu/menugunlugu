import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import OynaClient from "./OynaClient";
import SidebarLayout from "@/components/ui/SidebarLayout";
import AdSlot from "@/components/ui/AdSlot";

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

  return (
    <SidebarLayout placement="sidebar_oyna" adSenseSlot="oyna_dikey">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <AdSlot placement="oyna_banner" adSenseSlot="oyna_yatay_masaustu"
          imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="hidden sm:block mb-4" />
        <AdSlot placement="oyna_banner_mobile" adSenseSlot="oyna_yatay_mobil"
          imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="sm:hidden mb-4" />
      </div>
      <OynaClient leaderboard={leaderboard} />
    </SidebarLayout>
  );
}
