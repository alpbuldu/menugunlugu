import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import KorSiralamaGame from "./KorSiralamaGame";

export const metadata: Metadata = {
  title: "Kör Sıralama | Oyna",
  description: "Yemekleri görmeden sırala, sezgine güven!",
};

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default async function KorSiralamaPage() {
  const supabase = createAdminClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, image_url, category")
    .eq("approval_status", "approved")
    .not("image_url", "is", null)
    .limit(200);

  const pool = shuffle(recipes ?? []).slice(0, 40);
  return <KorSiralamaGame pool={pool as any} />;
}
